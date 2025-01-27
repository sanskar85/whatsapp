import { NextFunction, Request, Response } from 'express';
import { getOrCache } from '../../../config/cache';
import { CACHE_TOKEN_GENERATOR } from '../../../config/const';
import APIError, { API_ERRORS } from '../../../errors/api-errors';
import { WhatsappProvider } from '../../../provider/whatsapp_provider';
import GroupMergeService from '../../../services/merged-groups';
import { Respond } from '../../../utils/ExpressUtils';
import WhatsappUtils from '../../../utils/WhatsappUtils';

async function listGroups(req: Request, res: Response, next: NextFunction) {
	const { user } = req.locals;

	const client_id = WhatsappProvider.clientByUser(user.getUserId());

	if (!client_id) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const whatsapp = WhatsappProvider.clientByClientID(client_id)!;

	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	try {
		const { groups } = await getOrCache(
			CACHE_TOKEN_GENERATOR.CONTACTS(req.locals.user.getUser()._id),
			async () => await whatsappUtils.getContacts()
		);

		const merged_groups = await new GroupMergeService(req.locals.user.getUser()).listGroups();

		const results = [
			...groups.sort((a, b) => a.name.localeCompare(b.name)),
			...merged_groups
				.map((group) => ({
					id: group.id,
					isMergedGroup: group.isMergedGroup,
					name: group.name,
					participants: 0,
				}))
				.sort((a, b) => a.name.localeCompare(b.name)),
		];

		return Respond({
			res,
			status: 200,
			data: {
				groups: results,
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
}

const Controller = {
	listGroups,
};

export default Controller;
