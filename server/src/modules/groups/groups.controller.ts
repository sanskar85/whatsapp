import { NextFunction, Request, Response } from 'express';
import { GroupChat, MessageMedia } from 'whatsapp-web.js';
import { getOrCache, saveToCache } from '../../config/cache';
import {
	CACHE_TOKEN_GENERATOR,
	SOCKET_RESPONSES,
	TASK_PATH,
	TASK_RESULT_TYPE,
	TASK_TYPE,
} from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import GroupMergeService from '../../services/merged-groups';
import TaskService from '../../services/task';
import {
	TBusinessContact,
	TContact,
	TGroupBusinessContact,
	TGroupContact,
} from '../../types/whatsapp';
import CSVParser from '../../utils/CSVParser';
import DateUtils from '../../utils/DateUtils';
import { Delay, Respond, RespondCSV, idValidator } from '../../utils/ExpressUtils';
import VCFParser from '../../utils/VCFParser';
import WhatsappUtils, { MappedContacts } from '../../utils/WhatsappUtils';
import {
	FileUpload,
	FileUtils,
	ONLY_JPG_IMAGES_ALLOWED,
	ResolvedFile,
	SingleFileUploadOptions,
} from '../../utils/files';
import {
	CreateGroupValidationResult,
	GroupSettingValidationResult,
	MergeGroupValidationResult,
} from './groups.validator';

async function groups(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
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

		return Respond({
			res,
			status: 200,
			data: {
				groups: [...groups, ...merged_groups.map((group) => ({ ...group, groups: undefined }))],
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
}

async function refreshGroup(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	try {
		const contacts = await whatsappUtils.getContacts();
		await saveToCache(CACHE_TOKEN_GENERATOR.CONTACTS(req.locals.user.getUser()._id), contacts);
		const merged_groups = await new GroupMergeService(req.locals.user.getUser()).listGroups();

		return Respond({
			res,
			status: 200,
			data: {
				groups: [
					...contacts.groups,
					...merged_groups.map((group) => ({ ...group, groups: undefined })),
				],
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
}

async function exportGroups(req: Request, res: Response, next: NextFunction) {
	const { group_ids } = req.body as { group_ids: string[] };

	const { client_id } = req.locals;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	} else if (!Array.isArray(group_ids) || group_ids.length === 0) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}

	const taskService = new TaskService(req.locals.user.getUser());
	const options = {
		saved: req.body.saved ?? true,
		unsaved: req.body.unsaved ?? true,
		business_contacts_only: req.body.business_contacts_only ?? false,
		vcf: req.body.vcf ?? false,
	};

	const task_id = await taskService.createTask(
		TASK_TYPE.EXPORT_GROUP_CONTACTS,
		options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV,
		{
			description: `Export ${group_ids.length} groups.`,
		}
	);

	Respond({
		res,
		status: 201,
	});
	try {
		const groupMergeService = new GroupMergeService(req.locals.user.getUser());
		const merged_group_ids = group_ids.filter((id) => idValidator(id)[0]);
		const merged_group_whatsapp_ids = await groupMergeService.extractWhatsappGroupIds(
			merged_group_ids
		);

		let ids_to_export = [...group_ids, ...merged_group_whatsapp_ids].filter(
			(id) => !idValidator(id)[0] // check if all ids is valid whatsapp group ids
		);
		ids_to_export = [...new Set(ids_to_export)];

		const saved_contacts = (
			await Promise.all(
				(
					await getOrCache(
						CACHE_TOKEN_GENERATOR.CONTACTS(req.locals.user.getUser()._id),
						async () => whatsappUtils.getContacts()
					)
				).saved.map(async (contact) => ({
					...(await whatsappUtils.getContactDetails(contact)),
					...WhatsappUtils.getBusinessDetails(contact),
					isSaved: contact.isMyContact,
				}))
			)
		).reduce((acc, contact) => {
			acc[contact.number] = {
				name: contact.name ?? '',
				public_name: contact.public_name ?? '',
				number: contact.number ?? '',
				isBusiness: contact.isBusiness ?? 'Personal',
				country: contact.country ?? '',
				description: contact.description ?? '',
				email: contact.email ?? '',
				websites: contact.websites ?? [],
				latitude: contact.latitude ?? 0,
				longitude: contact.longitude ?? 0,
				address: contact.address ?? '',
				isSaved: contact.isSaved,
			};
			return acc;
		}, {} as MappedContacts);

		const groups = (
			await Promise.all(
				ids_to_export.map(async (group_id) => {
					try {
						const chat = await whatsapp.getClient().getChatById(group_id);
						if (!chat.isGroup) {
							throw new Error('Group not found');
						}
						return chat as GroupChat;
					} catch (err) {
						return null;
					}
				})
			)
		).filter((chat) => chat !== null) as GroupChat[];

		const participants = (
			await Promise.all(
				groups.map((groupChat) =>
					whatsappUtils.getGroupContacts(groupChat, {
						saved: options.saved,
						unsaved: options.unsaved,
						business_details: options.business_contacts_only,
						mapped_contacts: saved_contacts,
					})
				)
			)
		).flat();

		const data = options.vcf
			? options.business_contacts_only
				? VCFParser.exportBusinessContacts(participants as TBusinessContact[])
				: VCFParser.exportContacts(participants as TContact[])
			: options.business_contacts_only
			? CSVParser.exportGroupBusinessContacts(participants as TGroupBusinessContact[])
			: CSVParser.exportGroupContacts(participants as TGroupContact[]);

		const file_name = `Exported Contacts${options.vcf ? '.vcf' : '.csv'}`;

		const file_path = __basedir + TASK_PATH + task_id.toString() + (options.vcf ? '.vcf' : '.csv');

		await FileUtils.writeFile(file_path, data);

		taskService.markCompleted(task_id, file_name);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_COMPLETED, task_id.toString());
	} catch (err) {
		taskService.markFailed(task_id);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_FAILED, task_id.toString());
	}
}

async function createGroup(req: Request, res: Response, next: NextFunction) {
	const { csv_file, name } = req.locals.data as CreateGroupValidationResult;

	const { client_id } = req.locals;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	try {
		const parsed_csv = await FileUtils.readCSV(csv_file);
		if (!parsed_csv) {
			return next(new APIError(API_ERRORS.COMMON_ERRORS.ERROR_PARSING_CSV));
		}

		const numberIds = (
			await Promise.all(
				parsed_csv.map(async (row) => {
					const numberWithId = await whatsappUtils.getNumberWithId(row.number);
					if (!numberWithId) {
						return null; // Skips to the next iteration
					}
					return numberWithId.numberId;
				})
			)
		).filter((number) => number) as string[];

		whatsappUtils.createGroup(name, numberIds);

		return Respond({
			res,
			status: 200,
			data: {
				message: 'Group created successfully',
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
}

async function mergeGroup(req: Request, res: Response, next: NextFunction) {
	const { group_ids, group_name, ...req_data } = req.locals.data as MergeGroupValidationResult;

	const { client_id } = req.locals;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const chat_ids = (
		await Promise.all(
			group_ids.map(async (id) => {
				const chat = await whatsappUtils.getChat(id);
				if (!chat || !chat.isGroup) return null;
				return chat.id._serialized;
			})
		)
	).filter((chat) => chat !== null) as string[];

	const group = await new GroupMergeService(req.locals.user.getUser()).mergeGroup(
		group_name,
		chat_ids,
		req_data
	);

	return Respond({
		res,
		status: 200,
		data: {
			group: group,
		},
	});
}

async function updateMergedGroup(req: Request, res: Response, next: NextFunction) {
	const { group_ids, group_name, ...req_data } = req.locals.data as MergeGroupValidationResult;
	const { client_id } = req.locals;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const chat_ids = (
		await Promise.all(
			group_ids.map(async (id) => {
				const chat = await whatsappUtils.getChat(id);
				if (!chat || !chat.isGroup) return null;
				return chat.id._serialized;
			})
		)
	).filter((chat) => chat !== null) as string[];

	const group = await new GroupMergeService(req.locals.user.getUser()).updateGroup(
		req.locals.id,
		{
			group_ids: chat_ids,
			name: group_name,
		},
		req_data
	);

	return Respond({
		res,
		status: 200,
		data: {
			group,
		},
	});
}

async function toggleActive(req: Request, res: Response, next: NextFunction) {
	const active = await new GroupMergeService(req.locals.user.getUser()).toggleActive(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {
			active,
		},
	});
}

async function clearResponses(req: Request, res: Response, next: NextFunction) {
	await new GroupMergeService(req.locals.user.getUser()).clear(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function generateReport(req: Request, res: Response, next: NextFunction) {
	const data = await new GroupMergeService(req.locals.user.getUser()).generateReport(req.locals.id);

	return RespondCSV({
		res,
		filename: 'Exported Merged Group Responses',
		data: CSVParser.exportMergedResponses(data),
	});
}

async function mergedGroups(req: Request, res: Response, next: NextFunction) {
	try {
		const merged_groups = await new GroupMergeService(req.locals.user.getUser()).listGroups();

		return Respond({
			res,
			status: 200,
			data: {
				groups: merged_groups,
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
}

async function deleteMergedGroup(req: Request, res: Response, next: NextFunction) {
	new GroupMergeService(req.locals.user.getUser()).deleteGroup(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {
			message: 'Groups removed successfully',
		},
	});
}

async function updateGroupsPicture(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const fileUploadOptions: SingleFileUploadOptions = {
		field_name: 'file',
		options: {
			fileFilter: ONLY_JPG_IMAGES_ALLOWED,
		},
	};

	let uploadedFile: ResolvedFile | null = null;

	try {
		uploadedFile = await FileUpload.SingleFileUpload(req, res, fileUploadOptions);
	} catch (err: unknown) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.FILE_UPLOAD_ERROR, err));
	}

	const ids_to_export = req.body.groups as string[];
	if (!ids_to_export) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}
	const groups = (await Promise.all(
		ids_to_export
			.map(async (group_id) => {
				try {
					const chat = await whatsapp.getClient().getChatById(group_id);
					if (!chat.isGroup) {
						throw new Error('Group not found');
					}
					return chat as GroupChat;
				} catch (err) {
					return null;
				}
			})
			.filter((groupChat) => groupChat !== null)
	)) as GroupChat[];
	const media = MessageMedia.fromFilePath(uploadedFile.path);
	if (!media) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
	groups.forEach((groupChat) => {
		groupChat.setPicture(media);
	});

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function updateGroupsDetails(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const {
		description,
		edit_group_settings,
		send_messages,
		groups: ids_to_update,
	} = req.body as GroupSettingValidationResult;

	const authorId = whatsapp.getClient().info.wid._serialized;

	const groups = (await Promise.all(
		ids_to_update
			.map(async (group_id) => {
				try {
					const chat = await whatsapp.getClient().getChatById(group_id);
					if (!chat.isGroup) {
						throw new Error('Group not found');
					}
					for (let participant of (chat as GroupChat).participants) {
						if (participant.id._serialized === authorId) {
							return participant.isAdmin ? chat : null;
						}
					}
					return null;
				} catch (err) {
					return null;
				}
			})
			.filter((groupChat) => groupChat !== null)
	)) as GroupChat[];

	groups.forEach((groupChat) => {
		if (description !== undefined) {
			groupChat.setDescription(description);
		}
		if (edit_group_settings !== undefined) {
			groupChat.setInfoAdminsOnly(!edit_group_settings);
		}
		if (send_messages !== undefined) {
			groupChat.setMessagesAdminsOnly(!send_messages);
		}
	});

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function pendingRequests(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;
	const ids_to_export = Array.isArray(req.body.groups ?? '') ? (req.body.groups as string[]) : [];

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	const taskService = new TaskService(req.locals.user.getUser());

	const task_id = await taskService.createTask(
		TASK_TYPE.EXPORT_GROUP_CONTACTS,
		TASK_RESULT_TYPE.CSV,
		{
			description: `Export Groups Pending Participants.`,
		}
	);

	Respond({
		res,
		status: 201,
	});

	try {
		const groups = (
			await Promise.all(
				ids_to_export.map(async (group_id) => {
					try {
						const chat = await whatsapp.getClient().getChatById(group_id);
						if (!chat.isGroup) {
							throw new Error('Group not found');
						}
						return chat as GroupChat;
					} catch (err) {
						return null;
					}
				})
			)
		).filter((chat) => chat !== null) as GroupChat[];

		const participants = (
			await Promise.all(
				groups.map((groupChat) => whatsappUtils.getPendingGroupMembershipRequests(groupChat))
			)
		).flat();

		const data = CSVParser.exportPendingGroupParticipants(participants);

		const file_name = `Exported Pending Participants.csv`;

		const file_path = __basedir + TASK_PATH + task_id.toString() + '.csv';

		await FileUtils.writeFile(file_path, data);

		taskService.markCompleted(task_id, file_name);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_COMPLETED, task_id.toString());
	} catch (err) {
		taskService.markFailed(task_id);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_FAILED, task_id.toString());
	}
}

async function groupLinks(req: Request, res: Response, next: NextFunction) {
	const { client_id, data } = req.locals;
	const links = data as string[];

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp || !whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	const taskService = new TaskService(req.locals.user.getUser());

	const task_id = await taskService.createTask(
		TASK_TYPE.EXPORT_GROUP_LINK_DETAILS,
		TASK_RESULT_TYPE.CSV,
		{
			description: `Generate group links details.`,
		}
	);

	Respond({
		res,
		status: 201,
	});

	try {
		const groups: {
			[k: string]: string;
		}[] = [];

		for (const link of links) {
			const code = link.split('/').pop() ?? '';
			let retry_count = 0;
			let info: any = null;

			while (retry_count < 3) {
				try {
					info = await whatsapp.getClient().getInviteInfo(code);
					if (info) break;
				} catch (err: any) {}
				retry_count++;
				if (retry_count < 3) {
					await Delay(2);
				}
			}

			if (!info) {
				groups.push({
					Link: link,
					'Group ID': 'Unable to fetch records',
				});
				continue;
			}

			let details = {
				Link: link,
				'Group ID': info.id.user,
				'Group Name': info.subject,
				Description: info.desc,
				'Created At': DateUtils.getUnixMoment(info.creation).format('YYYY-MM-DD HH:mm:ss'),
				'Member Count': info.size,
				'Owner Name': '',
				'Owner Number': '',
				'Owner Public Name': '',
			};

			try {
				const owner_details = await whatsappUtils.getContactDetails(
					await whatsapp.getClient().getContactById(info.owner._serialized)
				);
				details = {
					...details,
					'Owner Name': owner_details.name,
					'Owner Number': owner_details.number,
					'Owner Public Name': owner_details.public_name,
				};
			} catch (err) {}

			const participants: {
				number: string;
				type: string;
			}[] = info.participants.map((participant: any) => ({
				number: participant.id.user,
				type: participant.isSuperAdmin ? 'CREATOR' : participant.isAdmin ? 'ADMIN' : 'USER',
			}));

			const participant_mapped = participants.reduce(
				(acc, item, index) => {
					acc[`Participant ${index + 1} Number`] = item.number;
					acc[`Participant ${index + 1} Type`] = item.type;
					return acc;
				},
				{} as {
					[k: string]: string;
				}
			);
			details = {
				...details,
				...participant_mapped,
			};

			groups.push(details);
		}

		const data = CSVParser.exportGroupLinkData(groups);

		const file_name = `Export Group Links Details.csv`;

		const file_path = __basedir + TASK_PATH + task_id.toString() + '.csv';

		await FileUtils.writeFile(file_path, data);

		taskService.markCompleted(task_id, file_name);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_COMPLETED, task_id.toString());
	} catch (err) {
		taskService.markFailed(task_id);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_FAILED, task_id.toString());
	}
}

const GroupsController = {
	groups,
	exportGroups,
	createGroup,
	mergeGroup,
	toggleActive,
	generateReport,
	clearResponses,
	deleteMergedGroup,
	mergedGroups,
	refreshGroup,
	updateMergedGroup,
	updateGroupsPicture,
	updateGroupsDetails,
	pendingRequests,
	groupLinks,
};

export default GroupsController;
