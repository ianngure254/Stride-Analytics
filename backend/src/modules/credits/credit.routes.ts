import { Router } from 'express';
import * as controller from './credit.controller';

const router = Router();

// ─── CRUD Routes -
router.get('/', controller.getAll);
router.get('/stats', controller.getStats);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id/status', controller.updateStatus);

// ─── Credit Management-
router.get('/:id/usage', controller.getUsageHistory);
router.post('/:id/use', controller.useCredit);

// ─── Custom-
router.get('/customers/:customerId/credits', controller.getCustomerCredits);

export default router;
