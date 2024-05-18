import express from 'express';
import { VerifyUser } from '../../middleware';
import { IDValidator } from '../../middleware/idValidator';
import TasksController from './tasks.controller';

const router = express.Router();

router.route('/:id/download').all(VerifyUser, IDValidator).get(TasksController.downloadTask);
router.route('/:id').all(VerifyUser, IDValidator).delete(TasksController.deleteTask);
router.route('/').all(VerifyUser).get(TasksController.listTasks);

export default router;
