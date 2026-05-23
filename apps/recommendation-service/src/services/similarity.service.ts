import prisma from '@packages/libs/prisma';
import redis from '@packages/libs/redis';

const CONTENT_SIMILAR_KEY = (id: string) => `content:similar:${id}`;
const CF_SIMILAR_KEY = (id: string) => `cf:similar:${id}`;
export const POPULARITY_KEY = 'popularity:ranked';

const TOP_N = 20;
const TTL = 86400; // 24 hours

const ACTION_WEIGHTS: Record<string, number> = {
  purchase: 1.0,
  add_to_cart: 0.7,
  add_to_wishlist: 0.5,
  product_view: 0.1,
};

// ── Content-based ─────────────────────────────────────────────────────────────

type FeatureVector = Map<string, number>;

function buildFeatureVector(product: {
  category: string;
  subCategory: string;
  tags: string[];
  brand?: string | null;
}): FeatureVector {
  const vec: FeatureVector = new Map();

  const add = (key: string, weight: number) =>
    vec.set(key, (vec.get(key) ?? 0) + weight);

  add(`cat:${product.category}`, 1.0);
  add(`sub:${product.subCategory}`, 1.5);
  if (product.brand) add(`brand:${product.brand.toLowerCase()}`, 1.0);
  for (const tag of product.tags ?? []) add(`tag:${tag}`, 3.0);

  return vec;
}

function cosineSimilarity(a: FeatureVector, b: FeatureVector): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [key, valA] of a) {
    magA += valA * valA;
    const valB = b.get(key);
    if (valB !== undefined) dot += valA * valB;
  }
  for (const valB of b.values()) magB += valB * valB;

  return magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

async function computeContentSimilarities(
  products: Array<{
    id: string;
    category: string;
    subCategory: string;
    tags: string[];
    brand?: string | null;
  }>
) {
  const vectors = products.map((p) => ({ id: p.id, vec: buildFeatureVector(p) }));
  const pipeline = redis.pipeline();

  for (let i = 0; i < vectors.length; i++) {
    const scores: { productId: string; score: number }[] = [];

    for (let j = 0; j < vectors.length; j++) {
      if (i === j) continue;
      const score = cosineSimilarity(vectors[i].vec, vectors[j].vec);
      if (score > 0) scores.push({ productId: vectors[j].id, score });
    }

    scores.sort((a, b) => b.score - a.score);
    pipeline.set(
      CONTENT_SIMILAR_KEY(vectors[i].id),
      JSON.stringify(scores.slice(0, TOP_N)),
      'EX',
      TTL
    );
  }

  await pipeline.exec();
  console.log('  ✓ Content similarities stored');
}

// ── Item-Item Collaborative Filtering ────────────────────────────────────────

async function computeCFSimilarities() {
  const allAnalytics = await prisma.userAnalytics.findMany({
    select: { userId: true, actions: true },
  });

  // productId → Map<userId, aggregated weight>
  const productUserWeights = new Map<string, Map<string, number>>();

  for (const ua of allAnalytics) {
    if (!Array.isArray(ua.actions)) continue;
    for (const action of ua.actions as any[]) {
      const productId = action.productId as string;
      const actionType = action.action as string;
      if (!productId || !actionType) continue;
      const weight = ACTION_WEIGHTS[actionType] ?? 0;
      if (weight === 0) continue;

      if (!productUserWeights.has(productId))
        productUserWeights.set(productId, new Map());

      const userMap = productUserWeights.get(productId)!;
      userMap.set(ua.userId, (userMap.get(ua.userId) ?? 0) + weight);
    }
  }

  const productIds = Array.from(productUserWeights.keys());
  const pipeline = redis.pipeline();

  for (let i = 0; i < productIds.length; i++) {
    const idA = productIds[i];
    const vecA = productUserWeights.get(idA)!;
    const scores: { productId: string; score: number }[] = [];

    let magA = 0;
    for (const w of vecA.values()) magA += w * w;

    for (let j = 0; j < productIds.length; j++) {
      if (i === j) continue;
      const idB = productIds[j];
      const vecB = productUserWeights.get(idB)!;

      let dot = 0;
      let magB = 0;
      for (const [userId, wA] of vecA) {
        const wB = vecB.get(userId);
        if (wB !== undefined) dot += wA * wB;
      }
      for (const w of vecB.values()) magB += w * w;

      const sim =
        magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
      if (sim > 0) scores.push({ productId: idB, score: sim });
    }

    scores.sort((a, b) => b.score - a.score);
    pipeline.set(
      CF_SIMILAR_KEY(idA),
      JSON.stringify(scores.slice(0, TOP_N)),
      'EX',
      TTL
    );
  }

  await pipeline.exec();
  console.log('  ✓ CF similarities stored');
}

// ── Popularity fallback ───────────────────────────────────────────────────────

async function computePopularityRanking(
  products: Array<{ id: string; total_sales: number; ratings: number }>
) {
  const maxSales = Math.max(...products.map((p) => p.total_sales), 1);

  const ranked = products
    .map((p) => ({
      productId: p.id,
      score: (p.total_sales / maxSales) * 0.7 + (p.ratings / 5) * 0.3,
    }))
    .sort((a, b) => b.score - a.score)
    .map((p) => p.productId);

  await redis.set(POPULARITY_KEY, JSON.stringify(ranked), 'EX', TTL);
  console.log('  ✓ Popularity ranking stored');
}

// ── Main export ───────────────────────────────────────────────────────────────

export const runOfflineSimilarityJob = async () => {
  console.log('🔄 Starting offline similarity computation...');
  const start = Date.now();

  const products = await prisma.products.findMany({
    where: { status: 'Active', isDeleted: false },
    select: {
      id: true,
      category: true,
      subCategory: true,
      tags: true,
      brand: true,
      sale_price: true,
      total_sales: true,
      ratings: true,
    },
  });

  console.log(`  → ${products.length} active products loaded`);

  await Promise.all([
    computeContentSimilarities(products),
    computeCFSimilarities(),
    computePopularityRanking(products),
  ]);

  console.log(`✅ Offline job done in ${Date.now() - start}ms`);
};
