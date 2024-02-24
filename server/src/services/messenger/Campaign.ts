import { Types } from 'mongoose';
import { CAMPAIGN_STATUS, MESSAGE_STATUS } from '../../config/const';
import { CampaignDB, MessageDB } from '../../repository/messenger';
import TimeGenerator from '../../structures/TimeGenerator';
import { IMessage } from '../../types/messenger';
import { IUser } from '../../types/user';
import DateUtils from '../../utils/DateUtils';
import MessageService from './Message';

export type Message = {
	number: string;
	message: TextMessage;
	attachments: {
		name: string;
		filename: string;
		caption: string | undefined;
	}[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	shared_contact_cards: Types.ObjectId[];
};

type TextMessage = string;

type Batch = {
	campaign_name: string;
	description: string;
	min_delay: number;
	max_delay: number;
	batch_size: number;
	batch_delay: number;
	startDate?: string;
	startsFrom?: string;
	startTime?: string;
	endTime?: string;
};

export default class CampaignService {
	private user: IUser;
	private messageService: MessageService;

	public constructor(user: IUser) {
		this.user = user;
		this.messageService = new MessageService(user);
	}
	async alreadyExists(name: string) {
		const exists = await CampaignDB.exists({ user: this.user, campaign_name: name });
		return exists !== null;
	}

	async scheduleCampaign(messages: Message[], opts: Batch) {
		const campaign = await CampaignDB.create({
			name: opts.campaign_name,
			description: opts.description,
			user: this.user,
		});
		const _messages: IMessage[] = [];
		const dateGenerator = new TimeGenerator(opts);
		for (const message of messages) {
			const msg = this.messageService.scheduleMessage({
				receiver: message.number,
				message: message.message ?? '',
				attachments: message.attachments ?? [],
				shared_contact_cards: message.shared_contact_cards ?? [],
				polls: message.polls ?? [],
				sendAt: dateGenerator.next().value,
			});
			_messages.push(msg);
		}

		campaign.messages = _messages;
		await campaign.save();
		return campaign;
	}

	async allCampaigns() {
		const campaigns = await CampaignDB.aggregate([
			{ $match: { user: this.user._id } },
			{
				$lookup: {
					from: MessageDB.collection.name, // Name of the OtherModel collection
					localField: 'messages',
					foreignField: '_id',
					as: 'messagesInfo',
				},
			},
			{
				$unwind: '$messagesInfo', // If messages is an array, unwind it to separate documents
			},
			{
				$group: {
					_id: '$_id', // Group by the campaign ID
					name: { $first: '$name' },
					description: { $first: '$description' },
					status: { $first: '$status' },
					startTime: { $first: '$startTime' },
					endTime: { $first: '$endTime' },
					createdAt: { $first: '$createdAt' },
					sent: { $sum: { $cond: [{ $eq: ['$messagesInfo.status', MESSAGE_STATUS.SENT] }, 1, 0] } },
					failed: {
						$sum: { $cond: [{ $eq: ['$messagesInfo.status', MESSAGE_STATUS.FAILED] }, 1, 0] },
					},
					pending: {
						$sum: {
							$cond: [{ $in: ['$messagesInfo.status', [MESSAGE_STATUS.PENDING]] }, 1, 0],
						},
					},
				},
			},
			{
				$project: {
					campaign_id: '$_id',
					_id: 0,
					name: 1,
					description: 1,
					status: 1,
					sent: 1,
					failed: 1,
					pending: 1,
					createdAt: 1,
					startTime: 1,
					endTime: 1,
					isPaused: { $eq: ['$status', CAMPAIGN_STATUS.PAUSED] },
				},
			},
		]);
		return campaigns
			.sort((a, b) =>
				DateUtils.getMoment(a.createdAt).isAfter(DateUtils.getMoment(b.createdAt)) ? -1 : 1
			)
			.map((message) => ({
				campaign_id: message.campaign_id as string,
				campaignName: message.name as string,
				description: message.description as string,
				status: message.status as string,
				sent: message.sent as number,
				failed: message.failed as number,
				pending: message.pending as number,
				createdAt: DateUtils.format(message.createdAt, 'DD-MM-YYYY HH:mm') as string,
				isPaused: message.isPaused as boolean,
			}));
	}

	async deleteCampaign(campaign_id: Types.ObjectId) {
		try {
			const campaign = await CampaignDB.findById(campaign_id);
			if (!campaign) {
				return;
			}
			await MessageDB.deleteMany({ _id: campaign.messages });
			await campaign.remove();
		} catch (err) {}
	}

	async pauseCampaign(campaign_id: Types.ObjectId) {
		try {
			const campaign = await CampaignDB.findById(campaign_id);
			if (!campaign) {
				return;
			}
			await MessageDB.updateMany(
				{ _id: campaign.messages, status: MESSAGE_STATUS.PENDING },
				{
					$set: {
						status: MESSAGE_STATUS.PAUSED,
					},
				}
			);
			campaign.status = CAMPAIGN_STATUS.PAUSED;
			await campaign.save();
		} catch (err) {}
	}
	async resumeCampaign(campaign_id: Types.ObjectId) {
		try {
			const campaign = await CampaignDB.findById(campaign_id);
			if (!campaign) {
				return;
			}
			await MessageDB.updateMany(
				{ _id: campaign.messages, status: MESSAGE_STATUS.PAUSED },
				{
					$set: {
						status: MESSAGE_STATUS.PENDING,
					},
				}
			);
			campaign.status = CAMPAIGN_STATUS.ACTIVE;
			await campaign.save();
		} catch (err) {}
	}

	async generateReport(campaign_id: Types.ObjectId) {
		const campaign = await CampaignDB.findById(campaign_id);
		if (!campaign) {
			return [];
		}
		const messages = await MessageDB.find({ _id: campaign.messages });
		return messages.map((message) => ({
			message: message.message,
			receiver: message.receiver.split('@')[0],
			attachments: message.attachments.length,
			contacts: message.shared_contact_cards.length,
			polls: message.polls.length,
			campaign_name: campaign.name,
			description: campaign.description,
			status: message.status,
			scheduled_at: message.sendAt
				? DateUtils.getMoment(message.sendAt).format('DD/MM/YYYY HH:mm:ss')
				: '',
		}));
	}
}
