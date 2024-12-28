import { NextFunction, Request, Response } from 'express';
import { getOrCache } from '../../config/cache';
import { CACHE_TOKEN_GENERATOR } from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import GroupMergeService from '../../services/merged-groups';
import UserPreferencesService from '../../services/user/userPreferences';
import { Respond } from '../../utils/ExpressUtils';
import WhatsappUtils from '../../utils/WhatsappUtils';
import {
	CreateMessageLogRule,
	CreateMessageModerationRule,
	UpdateMessageLogRule,
	UpdateMessageStar,
} from './preferences.validator';

async function getPreferences(req: Request, res: Response, next: NextFunction) {
	const userPrefService = await UserPreferencesService.getService(req.locals.user.getUserId());

	return Respond({
		res,
		status: 200,
		data: {
			isLoggerEnabled: userPrefService.isLoggerEnabled(),
			loggerRules: userPrefService.getMessageLogRules(),
			isMessageStarEnabled: userPrefService.isMessageStarEnabled(),
			messageStarRules: userPrefService.getMessageStarRules(),
		},
	});
}

async function getMessageLogRules(req: Request, res: Response, next: NextFunction) {
	const userPrefService = await UserPreferencesService.getService(req.locals.user.getUserId());

	return Respond({
		res,
		status: 200,
		data: { rules: userPrefService.getMessageLogRules() },
	});
}

async function enableMessageLogger(req: Request, res: Response, next: NextFunction) {
	const userPrefService = await UserPreferencesService.getService(req.locals.user.getUserId());
	await userPrefService.setLoggerEnabled(true);

	return Respond({
		res,
		status: 200,
	});
}

async function disableMessageLogger(req: Request, res: Response, next: NextFunction) {
	const userPrefService = await UserPreferencesService.getService(req.locals.user.getUserId());

	await userPrefService.setLoggerEnabled(false);

	return Respond({
		res,
		status: 200,
	});
}

async function addMessageLogRule(req: Request, res: Response, next: NextFunction) {
	const { client_id, user } = req.locals;
	const userPrefService = await UserPreferencesService.getService(user.getUserId());
	const data = req.locals.data as CreateMessageLogRule;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	let groups;

	try {
		const { groups: whatsappGroups } = await getOrCache(
			CACHE_TOKEN_GENERATOR.CONTACTS(user.getUserId().toString()),
			async () => await whatsappUtils.getContacts()
		);

		const merged_groups = await new GroupMergeService(req.locals.user.getUser()).listGroups();

		groups = [
			...whatsappGroups,
			...merged_groups.map((group) => ({ ...group, groups: undefined })),
		];
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	try {
		const group_map = new Map<string, string>();

		groups.forEach((group) => {
			group_map.set(group.id, group.name);
		});

		const rules = data.group_id.map((group_id) => {
			return {
				id: group_id,
				name: group_map.get(group_id) ?? '',
				include: data.include,
				exclude: data.exclude,
				loggers: data.loggers,
				saved: data.saved,
				unsaved: data.unsaved,
			};
		});

		await userPrefService.addMessageLogRule(rules);

		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function deleteMessageLogRule(req: Request, res: Response, next: NextFunction) {
	try {
		const userPrefService = await UserPreferencesService.getService(req.locals.user.getUserId());
		await userPrefService.deleteMessageLogRule(req.params.id as string);

		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function updateMessageLogRule(req: Request, res: Response, next: NextFunction) {
	try {
		const userPrefService = await UserPreferencesService.getService(req.locals.user.getUserId());
		await userPrefService.updateMessageLogRule(req.locals.data as UpdateMessageLogRule);

		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function updateMessageStarRules(req: Request, res: Response, next: NextFunction) {
	const userPrefService = await UserPreferencesService.getService(req.locals.user.getUserId());
	await userPrefService.setMessageStarRules(req.locals.data as UpdateMessageStar);

	return Respond({
		res,
		status: 200,
		data: {
			isMessageStarEnabled: userPrefService.isMessageStarEnabled(),
			messageStarRules: userPrefService.getMessageStarRules(),
		},
	});
}

async function addMessageModerationRule(req: Request, res: Response, next: NextFunction) {
	const { user } = req.locals;
	const userPrefService = await UserPreferencesService.getService(user.getUserId());
	const data = req.locals.data as CreateMessageModerationRule;

	const merged_groups = await new GroupMergeService(req.locals.user.getUser()).listGroups();

	const groups = merged_groups.flatMap((group) => group.groups);

	try {
		const rule = {
			merged_groups: data.merged_groups,
			groups: groups,
			file_types: data.file_types,
			admin_rule: data.admin_rule,
			creator_rule: data.creator_rule,
			title: data.title,
		};

		await userPrefService.addMessageModerationRule(rule);

		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function updateMessageModerationRule(req: Request, res: Response, next: NextFunction) {
	const { user } = req.locals;
	const userPrefService = await UserPreferencesService.getService(user.getUserId());
	const data = req.locals.data as CreateMessageModerationRule;

	const merged_groups = await new GroupMergeService(req.locals.user.getUser()).listGroups();

	const groups = merged_groups.flatMap((group) => group.groups);

	try {
		const rule = {
			merged_groups: data.merged_groups,
			groups: groups,
			file_types: data.file_types,
			admin_rule: data.admin_rule,
			creator_rule: data.creator_rule,
			title: data.title,
		};

		await userPrefService.updateMessageModerationRule(rule);

		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function deleteMessageModerationRules(req: Request, res: Response, next: NextFunction) {
	try {
		const userPrefService = await UserPreferencesService.getService(req.locals.user.getUserId());
		await userPrefService.deleteMessageModerationRule(req.params.id as string);

		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

const Controller = {
	getPreferences,
	getMessageLogRules,
	enableMessageLogger,
	disableMessageLogger,
	addMessageLogRule,
	deleteMessageLogRule,
	updateMessageLogRule,
	updateMessageStarRules,
	addMessageModerationRule,
	updateMessageModerationRule,
	deleteMessageModerationRules,
};

export default Controller;
