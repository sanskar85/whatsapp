import express from 'express';
import { VerifyUser } from '../../middleware';
import { IDValidator } from '../../middleware/idValidator';
import ReportsController from './report.controller';

const router = express.Router();

router
	.route('/campaign/:id/pause')
	.all(VerifyUser, IDValidator)
	.post(ReportsController.pauseCampaign);
router
	.route('/campaign/:id/resume')
	.all(VerifyUser, IDValidator)
	.post(ReportsController.resumeCampaign);
router
	.route('/campaign/:id/delete')
	.all(VerifyUser, IDValidator)
	.delete(ReportsController.deleteCampaign);
router.route('/campaign/:id').all(VerifyUser, IDValidator).get(ReportsController.generateReport);
router.route('/campaign').all(VerifyUser).get(ReportsController.listCampaigns);

router.route('/polls').all(VerifyUser).get(ReportsController.listPolls);

router.route('/leads/business').all(VerifyUser).get(ReportsController.listLeads);

export default router;
