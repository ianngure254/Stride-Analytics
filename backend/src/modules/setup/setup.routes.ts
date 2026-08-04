import { Router } from 'express';
import { authenticateWithoutBusiness, attachBusinessContext } from '../../middleware/auth.middleware';
import * as controller from './setup.controller';

const router = Router();

// Setup business context (call after registration)
// Requires valid token but not existing business context
router.post('/business', authenticateWithoutBusiness, controller.setupBusinessContext);

// Get current business context (requires auth + business)
router.get('/business', authenticateWithoutBusiness, attachBusinessContext, controller.getBusinessContext);

export default router;
