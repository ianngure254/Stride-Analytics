import { Router } from 'express';
import { authenticate, attachBusinessContext } from '../../middleware/auth.middleware';
import * as controller from './payment.controller';

const router = Router();

// Apply authentication and business context to all payment routes
router.use(authenticate);
router.use(attachBusinessContext);

// ─── CRUD Routes ─────────────────────────────────────────────────────────────
router.get('/', controller.getAll);
router.get('/stats', controller.getStats);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id/status', controller.updateStatus);

// ─── Sale Payment Summary ───────────────────────────────────────────────────
router.get('/sales/:saleId/payments', controller.getSalePayments);

export default router;
