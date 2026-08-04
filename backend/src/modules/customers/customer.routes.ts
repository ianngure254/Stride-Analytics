import { Router } from 'express';
import { authenticate, attachBusinessContext } from '../../middleware/auth.middleware';
import * as controller from './customer.controller';

const router = Router();

// Apply authentication and business context to all customer routes
router.use(authenticate);
router.use(attachBusinessContext);

// ─── CRUD Routes ─────────────────────────────────────────────────────────────
router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.get('/:id/stats', controller.getStats);
router.put('/:id', controller.update);
router.patch('/:id/clear', controller.clearOne);
router.delete('/:id', controller.remove);

export default router;
