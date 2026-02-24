import { Router } from 'express';
import { getCorporateData, updateCorporateData } from '../controllers/corporateController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Endpoint for corporate stats
router.get('/', authMiddleware, getCorporateData);
router.put('/', authMiddleware, updateCorporateData);

export default router;
