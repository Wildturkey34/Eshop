import prisma from '@packages/libs/prisma';
import redis from '@packages/libs/redis';
import { POPULARITY_KEY } from './similarity.service';

const CONTENT_SIMILAR_KEY = (id: string) => `content:similar:${id}`;
const CF_SIMILAR_KEY = (id: string) => `cf:similar:${id}`;

const TOP_N = 10;

const ACTION_WEIGHTS: Record<string, number> = {
  purchase: 1.0,
  add_to_cart: 0.7,
  add_to_wishlist: 0.5,
  product_view: 0.1,
};

// α scales with history richness: 0 interactions → α=0 (pure content),
// 50+ interactions → α=1 (pure CF)
function computeAlpha(actionCount: number): number {
  return Math.min(actionCount / 50, 1);
}

async function getRedisJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await Promise.race([
      redis.get(key),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const getRecommendations = async (userId: string): Promise<string[]> => {
  const analytics = await prisma.userAnalytics.findUnique({
    where: { userId },
    select: { actions: true },
  });

  const actions = Array.isArray(analytics?.actions)
    ? (analytics!.actions as any[])
    : [];

  // Cold start — no interaction history
  if (actions.length === 0) {
    const popular = await getRedisJson<string[]>(POPULARITY_KEY);
    return (popular ?? []).slice(0, TOP_N);
  }

  const alpha = computeAlpha(actions.length);
  const interactedIds = new Set(actions.map((a: any) => a.productId as string));

  // Per interacted product: keep the highest action weight seen
  const uniqueInteractions = new Map<string, number>();
  for (const action of actions) {
    const w = ACTION_WEIGHTS[action.action as string] ?? 0;
    const current = uniqueInteractions.get(action.productId) ?? 0;
    if (w > current) uniqueInteractions.set(action.productId, w);
  }

  // Candidate scores aggregated from all interacted products' neighbours
  const candidateScores = new Map<string, { cf: number; content: number }>();

  const addScore = (
    productId: string,
    type: 'cf' | 'content',
    score: number,
    sourceWeight: number
  ) => {
    if (interactedIds.has(productId)) return;
    const entry = candidateScores.get(productId) ?? { cf: 0, content: 0 };
    entry[type] += score * sourceWeight;
    candidateScores.set(productId, entry);
  };

  // Fetch precomputed neighbours from Redis in parallel
  await Promise.all(
    Array.from(uniqueInteractions.entries()).map(
      async ([productId, sourceWeight]) => {
        const [contentSimilar, cfSimilar] = await Promise.all([
          getRedisJson<{ productId: string; score: number }[]>(
            CONTENT_SIMILAR_KEY(productId)
          ),
          getRedisJson<{ productId: string; score: number }[]>(
            CF_SIMILAR_KEY(productId)
          ),
        ]);

        for (const item of contentSimilar ?? [])
          addScore(item.productId, 'content', item.score, sourceWeight);
        for (const item of cfSimilar ?? [])
          addScore(item.productId, 'cf', item.score, sourceWeight);
      }
    )
  );

  // Fall back to popularity if Redis has no precomputed data yet
  if (candidateScores.size === 0) {
    const popular = await getRedisJson<string[]>(POPULARITY_KEY);
    return (popular ?? [])
      .filter((id) => !interactedIds.has(id))
      .slice(0, TOP_N);
  }

  // Blend: final_score = α × CF_score + (1 − α) × content_score
  return Array.from(candidateScores.entries())
    .map(([productId, { cf, content }]) => ({
      productId,
      score: alpha * cf + (1 - alpha) * content,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N)
    .map((r) => r.productId);
};
