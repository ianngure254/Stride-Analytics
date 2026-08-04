import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.middleware';
import * as controller from './assistant.controller';

const router = Router();

router.use(optionalAuth);
router.post('/chat', controller.chat);

export default router;
