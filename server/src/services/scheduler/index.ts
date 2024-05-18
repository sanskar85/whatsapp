import { Types } from 'mongoose';
import { MESSAGE_SCHEDULER_TYPE, MESSAGE_STATUS } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import ContactCardDB from '../../repository/contact-cards';
import { MessageDB } from '../../repository/messenger';
import SchedulerDB from '../../repository/scheduler';
import IUpload from '../../types/uploads';
import { IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import { randomMessageText } from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';
import { MessageService } from '../messenger';

export default class SchedulerService {
	private user: IUser;

	public constructor(user: IUser) {
		this.user = user;
	}

	public async allScheduler() {
		const scheduler = await SchedulerDB.find({
			user: this.user,
		}).populate('attachments');
		return scheduler.map((e) => ({
			id: e._id as Types.ObjectId,
			title: e.title,
			description: e.description,
			csv: e.csv,
			random_string: e.random_string,
			message: e.message,
			attachments: e.attachments,
			shared_contact_cards: e.shared_contact_cards ?? [],
			polls: e.polls,
			isActive: e.active,
			start_from: e.start_from,
			end_at: e.end_at,
		}));
	}

	public async schedulerByID(id: Types.ObjectId) {
		const scheduler = await SchedulerDB.findById(id).populate('attachments');

		if (!scheduler) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}

		return {
			id: scheduler._id as Types.ObjectId,
			title: scheduler.title,
			description: scheduler.description,
			csv: scheduler.csv,
			random_string: scheduler.random_string,
			message: scheduler.message,
			attachments: scheduler.attachments,
			shared_contact_cards: scheduler.shared_contact_cards ?? [],
			polls: scheduler.polls,
			isActive: scheduler.active,
			start_from: scheduler.start_from,
			end_at: scheduler.end_at,
		};
	}

	public createScheduler(data: {
		title: string;
		description: string;
		random_string: boolean;
		message: string;
		start_from: string;
		end_at: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: IUpload[];
		csv: Types.ObjectId;
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	}) {
		const scheduler = new SchedulerDB({
			...data,
			user: this.user,
		});

		scheduler.save();
		return {
			id: scheduler._id as Types.ObjectId,
			title: scheduler.title,
			description: scheduler.description,
			csv: scheduler.csv,
			random_string: scheduler.random_string,
			message: scheduler.message,
			attachments: scheduler.attachments,
			shared_contact_cards: scheduler.shared_contact_cards ?? [],
			polls: scheduler.polls,
			isActive: scheduler.active,
			start_from: scheduler.start_from,
			end_at: scheduler.end_at,
		};
	}

	public async modifyScheduler(
		id: Types.ObjectId,
		data: {
			title: string;
			description: string;
			random_string: boolean;
			message: string;
			start_from: string;
			end_at: string;
			shared_contact_cards: Types.ObjectId[];
			attachments: IUpload[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		}
	) {
		const scheduler = await SchedulerDB.findById(id).populate('attachments');
		if (!scheduler) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}

		if (data.title) {
			scheduler.title = data.title;
		}
		if (data.description) {
			scheduler.description = data.description;
		}
		if (data.message) {
			scheduler.message = data.message;
		}
		if (data.start_from) {
			scheduler.start_from = data.start_from;
		}
		if (data.end_at) {
			scheduler.end_at = data.end_at;
		}
		if (data.attachments) {
			scheduler.attachments = data.attachments;
		}
		if (data.polls) {
			scheduler.polls = data.polls;
		}
		scheduler.random_string = data.random_string;
		scheduler.shared_contact_cards = await ContactCardDB.find({
			_id: { $in: data.shared_contact_cards },
		});

		await scheduler.save();

		return {
			id: scheduler._id as Types.ObjectId,
			title: scheduler.title,
			description: scheduler.description,
			csv: scheduler.csv,
			random_string: scheduler.random_string,
			message: scheduler.message,
			attachments: scheduler.attachments,
			shared_contact_cards: scheduler.shared_contact_cards ?? [],
			polls: scheduler.polls,
			isActive: scheduler.active,
			start_from: scheduler.start_from,
			end_at: scheduler.end_at,
		};
	}

	public async toggleActive(id: Types.ObjectId) {
		const scheduler = await SchedulerDB.findById(id);
		if (!scheduler) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		scheduler.active = !scheduler.active;
		if (scheduler.active) {
			await MessageDB.updateMany(
				{
					'scheduled_by.id': id,
					status: MESSAGE_STATUS.PAUSED,
				},
				{
					$set: {
						status: MESSAGE_STATUS.PENDING,
					},
				}
			);
		} else {
			await MessageDB.updateMany(
				{
					status: MESSAGE_STATUS.PENDING,
					'scheduled_by.id': id,
				},
				{
					$set: {
						status: MESSAGE_STATUS.PAUSED,
					},
				}
			);
		}
		scheduler.save();
		return {
			id: scheduler._id as Types.ObjectId,
			title: scheduler.title,
			description: scheduler.description,
			csv: scheduler.csv.filename,
			random_string: scheduler.random_string,
			message: scheduler.message,
			attachments: scheduler.attachments,
			shared_contact_cards: scheduler.shared_contact_cards ?? [],
			polls: scheduler.polls,
			isActive: scheduler.active,
			start_from: scheduler.start_from,
			end_at: scheduler.end_at,
		};
	}

	public async deleteBot(id: Types.ObjectId) {
		await SchedulerDB.deleteOne({ _id: id });
	}

	public async generateReport(id: Types.ObjectId) {
		const scheduler = await SchedulerDB.findById(id);
		if (!scheduler) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		const messages = await MessageDB.find({
			'scheduled_by.id': id,
			sendAt: { $gte: DateUtils.getMomentNow().subtract(1, 'years').toDate() },
		});

		return messages.map((message) => ({
			campaign_name: scheduler.title,
			description: scheduler.description,
			message: message.message,
			receiver: message.receiver.split('@')[0],
			attachments: message.attachments.length,
			contacts: message.shared_contact_cards.length,
			polls: message.polls.length,
			status: message.status,
			scheduled_at: message.sendAt
				? DateUtils.getMoment(message.sendAt).format('DD/MM/YYYY HH:mm:ss')
				: '',
		}));
	}

	public async scheduleMessagesByID(id: Types.ObjectId) {
		const scheduler = await SchedulerDB.findOne({
			_id: id,
			active: true,
		}).populate('attachments shared_contact_cards csv device');
		const today = DateUtils.getMomentNow().format('MM-DD');

		if (
			!scheduler ||
			!scheduler.csv ||
			!scheduler.csv.headers.includes('date') ||
			!scheduler.csv.headers.includes('month')
		) {
			return;
		}
		const parsed_csv:
			| {
					[key: string]: string;
					date: string;
					month: string;
					number: string;
			  }[]
			| null = await FileUtils.readCSV(scheduler.csv.filename);
		if (!parsed_csv) {
			return;
		}
		const schedulerService = new MessageService(scheduler.user);

		for (const row of parsed_csv) {
			if (DateUtils.getMoment(row.month + '-' + row.date, 'MM-DD').format('MM-DD') !== today) {
				continue;
			}
			const time = DateUtils.getBetween(scheduler.start_from, scheduler.end_at);
			let _message = scheduler.message;

			for (const variable of scheduler.csv.headers) {
				_message = _message.replace(new RegExp(`{{${variable}}}`, 'g'), row[variable] ?? '');
			}
			if (_message.length > 0 && scheduler.random_string) {
				_message += randomMessageText();
			}

			schedulerService.scheduleMessage(
				{
					receiver: `${row.number}@c.us`,
					sendAt: time.toDate(),
					attachments: scheduler.attachments.map((attachment) => ({
						name: attachment.name,
						filename: attachment.filename,
						caption: attachment.caption,
					})),
					polls: scheduler.polls,
					shared_contact_cards: scheduler.shared_contact_cards.map(
						({ _id }) => new Types.ObjectId(_id)
					),
					message: _message,
				},
				{
					scheduled_by: MESSAGE_SCHEDULER_TYPE.SCHEDULER,
					scheduler_id: scheduler._id,
					device_id: scheduler.device._id,
				}
			);
		}
	}

	public static async scheduleDailyMessages() {
		const schedulers = await SchedulerDB.find({
			active: true,
		}).populate('attachments shared_contact_cards csv device');
		const today = DateUtils.getMomentNow().format('MM-DD');

		for (const scheduler of schedulers) {
			if (
				!scheduler.csv ||
				!scheduler.csv.headers.includes('date') ||
				!scheduler.csv.headers.includes('month')
			) {
				continue;
			}
			const parsed_csv:
				| {
						[key: string]: string;
						date: string;
						month: string;
						number: string;
				  }[]
				| null = await FileUtils.readCSV(scheduler.csv.filename);
			if (!parsed_csv) {
				continue;
			}
			const schedulerService = new MessageService(scheduler.user);

			for (const row of parsed_csv) {
				if (DateUtils.getMoment(row.month + '-' + row.date, 'MM-DD').format('MM-DD') !== today) {
					continue;
				}
				const time = DateUtils.getBetween(scheduler.start_from, scheduler.end_at);
				let _message = scheduler.message;

				for (const variable of scheduler.csv.headers) {
					_message = _message.replace(new RegExp(`{{${variable}}}`, 'g'), row[variable] ?? '');
				}
				if (_message.length > 0 && scheduler.random_string) {
					_message += randomMessageText();
				}

				schedulerService.scheduleMessage(
					{
						receiver: `${row.number}@c.us`,
						sendAt: time.toDate(),
						attachments: scheduler.attachments.map((attachment) => ({
							name: attachment.name,
							filename: attachment.filename,
							caption: attachment.caption,
						})),
						polls: scheduler.polls,
						shared_contact_cards: scheduler.shared_contact_cards.map(
							({ _id }) => new Types.ObjectId(_id)
						),
						message: _message,
					},
					{
						scheduled_by: MESSAGE_SCHEDULER_TYPE.SCHEDULER,
						scheduler_id: scheduler._id,
						device_id: scheduler.device._id,
					}
				);
			}
		}
	}
}
