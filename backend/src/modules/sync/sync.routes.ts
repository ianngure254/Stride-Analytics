import { Router } from 'express';
import { syncController } from './sync.controller';

const router = Router();

// Get sync status (must be before /:table route)
router.get('/status', syncController.getStatus.bind(syncController));

// Pull data from server (with optional lastSync timestamp)
router.get('/:table', syncController.pullData.bind(syncController));

// Push operations to server
router.post('/:table', syncController.pushCreate.bind(syncController));
router.put('/:table/:id', syncController.pushUpdate.bind(syncController));
router.delete('/:table/:id', syncController.pushDelete.bind(syncController));

export default router;
