import prisma from '@packages/libs/prisma';
import { NextFunction, Response } from 'express';
import { getRecommendations } from '../services/recommendationService';

export const getRecommendedProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    // Wrap entire recommendation logic with a 5s timeout
    const recommendedIds = await Promise.race([
      getRecommendations(userId),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 5000)),
    ]);

    if (recommendedIds.length === 0) {
      return res.status(200).json({ success: true, recommendations: [] });
    }

    const products = await prisma.products.findMany({
      where: { id: { in: recommendedIds }, status: 'Active', isDeleted: false },
      include: { images: true, Shop: true },
    });

    // Preserve ranked order from recommendation engine
    const ordered = recommendedIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    res.status(200).json({ success: true, recommendations: ordered });
  } catch (error) {
    return next(error);
  }
};
