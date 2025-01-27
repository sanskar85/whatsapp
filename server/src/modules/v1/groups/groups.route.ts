import express from 'express';
import Controller from './groups.controller';

const router = express.Router();

router.route('/groups').get(Controller.listGroups);

export default router;
