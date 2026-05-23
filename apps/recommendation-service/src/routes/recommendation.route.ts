import { Router } from 'express';
import { isAuthenticated } from '@packages/middleware';
import { getRecommendedProducts } from '../controllers/recommendation-controller';

const router = Router();

router.get('/recommendations', isAuthenticated, getRecommendedProducts);

export default router;
