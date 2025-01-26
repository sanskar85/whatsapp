import { NextFunction, Request, Response } from 'express';
import { SOCKET_RESPONSES, TASK_RESULT_TYPE, TASK_TYPE } from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { CampaignService } from '../../services';
import GroupMergeService from '../../services/merged-groups';
import TaskService from '../../services/task';
import UploadService from '../../services/uploads';
import { DeviceService } from '../../services/user';
import { Respond } from '../../utils/ExpressUtils';
import MessagesUtils from '../../utils/Messages';
import WhatsappUtils from '../../utils/WhatsappUtils';
import { FileUtils } from '../../utils/files';
import { ScheduleMessageValidationResult } from './message.validator';

export async function scheduleMessage(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;

	const req_data = req.locals.data as ScheduleMessageValidationResult;
	const {
		type,
		group_ids,
		label_ids,
		csv_file,
		variables,
		message,
		attachments,
		shared_contact_cards,
		polls,
		numbers: requestedNumberList,
		remove_duplicates,
	} = req_data;

	let messages: string[] = [];
	let numbers: string[] = [];
	let _attachments:
		| {
				filename: string;
				caption: string;
				name: string;
		  }[][]
		| null = null;

	const deviceService = await DeviceService.getServiceByClientID(req.locals.client_id);
	const { isSubscribed, isNew } = deviceService.isSubscribed();

	if (!isSubscribed && !isNew) {
		return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_REQUIRED));
	}

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const taskService = new TaskService(req.locals.user.getUser());
	const task_id = await taskService.createTask(TASK_TYPE.SCHEDULE_CAMPAIGN, TASK_RESULT_TYPE.NONE, {
		description: req_data.campaign_name,
	});
	const campaignService = new CampaignService(req.locals.user.getUser());
	const campaign_exists = await campaignService.alreadyExists(req_data.campaign_name);
	if (campaign_exists) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.ALREADY_EXISTS));
	}

	Respond({
		res,
		status: 201,
	});

	const groupMergeService = new GroupMergeService(req.locals.user.getUser());

	const uploadService = new UploadService(req.locals.user.getUser());
	const [uploaded_attachments] = await uploadService.listAttachments(attachments);

	if (type === 'NUMBERS') {
		numbers = await whatsappUtils.getNumberIds(requestedNumberList as string[]);
	} else if (type === 'CSV') {
		const csv = await uploadService.getCSVFile(csv_file);
		if (!csv) {
			return taskService.markFailed(task_id);
		}
		const parsed_csv = await FileUtils.readCSV(csv);
		if (!parsed_csv) {
			return taskService.markFailed(task_id);
		}

		messages = [];
		_attachments = [];

		const promises = parsed_csv.map(async (row) => {
			const numberWithId = await whatsappUtils.getNumberWithId(row.number);
			if (!numberWithId) {
				numbers.push(row.number + '@c.us');
			} else {
				numbers.push(numberWithId.numberId);
			}
			_attachments!.push(MessagesUtils.formatAttachments(uploaded_attachments, variables, row));
			messages?.push(MessagesUtils.formatMessageText(message, variables, row));
		});

		await Promise.all(promises);
	} else if (type === 'GROUP_INDIVIDUAL') {
		try {
			const _group_ids = await groupMergeService.extractWhatsappGroupIds(group_ids);
			numbers = (
				await Promise.all(_group_ids.map((id) => whatsappUtils.getParticipantsChatByGroup(id)))
			).flat();
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	} else if (type === 'GROUP_INDIVIDUAL_WITHOUT_ADMINS') {
		try {
			const _group_ids = await groupMergeService.extractWhatsappGroupIds(group_ids);
			numbers = (
				await Promise.all(
					_group_ids.map((id) =>
						whatsappUtils.getParticipantsChatByGroup(id, {
							exclude_admins: true,
						})
					)
				)
			).flat();
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	} else if (type === 'GROUP') {
		try {
			const _group_ids = await groupMergeService.extractWhatsappGroupIds(group_ids);
			numbers = await whatsappUtils.getChatIds(_group_ids);
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	} else if (type === 'LABEL') {
		try {
			numbers = (
				await Promise.all(label_ids.map((id) => whatsappUtils.getChatIdsByLabel(id)))
			).flat();
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	} else if (type === 'SAVED') {
		numbers = (await whatsappUtils.getContacts()).saved.map((contact) => contact.number);
	} else if (type === 'UNSAVED') {
		numbers = (await whatsappUtils.getContacts()).non_saved.map((contact) => contact.number);
	}

	let sendMessageList = numbers.map((number, index) => {
		const _message = type === 'CSV' ? messages[index] : message ?? '';
		const attachments = type === 'CSV' ? _attachments![index] : uploaded_attachments;
		return {
			number,
			message: _message,
			attachments: attachments,
			shared_contact_cards: shared_contact_cards,
			polls: polls,
		};
	});

	if (remove_duplicates) {
		sendMessageList = sendMessageList.filter((item, index, self) => {
			return self.findIndex((t) => t.number === item.number) === index;
		});
	}

	try {
		if (campaign_exists) {
			return taskService.markFailed(task_id);
		}
		const campaign = await campaignService.scheduleCampaign(sendMessageList, {
			...req_data,
			description: req_data.description,
			startsFrom: req_data.startDate,
			startTime: req_data.startTime,
			endTime: req_data.endTime,
			device_id: deviceService.getUserId(),
		});

		taskService.markCompleted(task_id, campaign._id);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_COMPLETED, task_id.toString());
	} catch (err) {
		return taskService.markFailed(task_id);
	}
}

const MessageController = {
	scheduleMessage,
};

export default MessageController;
