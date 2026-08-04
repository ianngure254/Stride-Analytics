// src/routes/index.ts
import { Router }      from 'express';
import productRoutes   from '../modules/products/product.routes';
import salesRoutes     from '../modules/sales/sale.routes';
import customerRoutes  from '../modules/customers/customer.routes';
import paymentRoutes   from '../modules/payments/payment.routes';
import creditRoutes    from '../modules/credits/credit.routes';
import setupRoutes     from '../modules/setup/setup.routes';
import assistantRoutes from '../modules/assistant/assistant.routes';
import syncRoutes      from '../modules/sync/sync.routes';

const router = Router();

router.use('/setup',     setupRoutes);
router.use('/products',  productRoutes);
router.use('/sales',     salesRoutes);
router.use('/customers', customerRoutes);
router.use('/payments',  paymentRoutes);
router.use('/credit',    creditRoutes);
router.use('/assistant', assistantRoutes);
router.use('/sync',      syncRoutes);

export default router;
