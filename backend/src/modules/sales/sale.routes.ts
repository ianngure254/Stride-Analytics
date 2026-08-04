import { Router } from 'express';
import { authenticate, attachBusinessContext } from '../../middleware/auth.middleware';
import * as controller from './sale.controller';

const router = Router();

// Apply authentication and business context to all sale routes
router.use(authenticate);
router.use(attachBusinessContext);

// ─── CRUD Routes ─────────────────────────────────────────────────────────────
router.get('/', controller.getAll);
router.get('/stats', controller.getStats);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id/status', controller.updateStatus);

// ─── Customer Sales History ───────────────────────────────────────────────────
router.get('/customers/:customerId/sales', controller.getCustomerHistory);

export default router;
