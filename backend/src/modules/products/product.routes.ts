import { Router } from 'express';
import { authenticate, attachBusinessContext } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as controller from './product.controller';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from './product.validation';

const router = Router();

// Apply authentication and business context to all product routes
router.use(authenticate);
router.use(attachBusinessContext);

router.get('/low-stock', controller.getLowStock);
router.get('/categories', controller.getCategories);

router.get('/', controller.getAll);
router.post('/', validate(createProductSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(updateProductSchema), controller.update);
router.delete('/:id', controller.remove);

router.patch('/:id/stock', validate(updateStockSchema), controller.updateStock);

export default router;