import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import PaymentValidator from '../../middleware/VerifyPayment';
import { IDValidator } from '../../middleware/idValidator';
import GroupsController from './groups.controller';
import {
	CreateGroupValidator,
	GroupSettingValidator,
	MergeGroupValidator,
} from './groups.validator';

const router = express.Router();

router
	.route('/export')
	.all(VerifyUser, VerifyClientID, PaymentValidator.isSubscribed)
	.post(GroupsController.exportGroups);

router
	.route('/merge/:id/clear-responses')
	.all(VerifyUser, IDValidator)
	.post(GroupsController.clearResponses);
router
	.route('/merge/:id/download-responses')
	.all(VerifyUser, IDValidator)
	.get(GroupsController.generateReport);

router
	.route('/merge/:id/toggle-active')
	.all(VerifyUser, IDValidator)
	.post(GroupsController.toggleActive);

router
	.route('/merge/:id')
	.all(VerifyUser, IDValidator)
	.delete(GroupsController.deleteMergedGroup)
	.all(VerifyClientID, MergeGroupValidator)
	.patch(GroupsController.updateMergedGroup);

router
	.route('/merge')
	.all(VerifyUser)
	.get(GroupsController.mergedGroups)
	.all(VerifyClientID, MergeGroupValidator)
	.post(GroupsController.mergeGroup);

router.route('/refresh').post(VerifyUser, VerifyClientID, GroupsController.refreshGroup);

router
	.route('/')
	.all(VerifyUser, VerifyClientID)
	.get(GroupsController.groups)
	.put(GroupsController.updateGroupsPicture)
	.all(CreateGroupValidator)
	.post(GroupsController.createGroup)
	.all(GroupSettingValidator)
	.patch(GroupsController.updateGroupsDetails);

export default router;
