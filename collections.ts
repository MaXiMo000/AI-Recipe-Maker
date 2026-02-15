import { Router, RequestHandler } from 'express';
import { authenticateToken } from './auth';
import { collectionController } from './collectionController';
import { standardLimiter } from './rateLimiter';

const auth = authenticateToken as RequestHandler;
const router = Router();

router.get('/', auth, standardLimiter, collectionController.list);
router.post('/', auth, standardLimiter, collectionController.create);
router.get('/:id', auth, collectionController.getById);
router.put('/:id', auth, collectionController.update);
router.delete('/:id', auth, collectionController.delete);

export default router;
