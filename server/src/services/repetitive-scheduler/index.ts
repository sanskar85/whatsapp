import { Types } from 'mongoose';
import { MESSAGE_SCHEDULER_TYPE, MESSAGE_STATUS } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import ContactCardDB from '../../repository/contact-cards';
import { MessageDB } from '../../repository/messenger';
import RepetitiveSchedulerDB from '../../repository/repetitive-scheduler';
import UploadDB from '../../repository/uploads';
import TimeGenerator from '../../structures/TimeGenerator';
import IRepetitiveScheduler from '../../types/repetitive-scheduler';
import IUpload from '../../types/uploads';
import { IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import { randomMessageText } from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';
import { MessageService } from '../messenger';
import { UserService } from '../user';

function formatDoc(doc: IRepetitiveScheduler) {
	return {
		id: doc._id as Types.ObjectId,
		user: doc.user,
		recipient_from: doc.recipient_from,
		recipient_data: doc.recipient_data as unknown as string | string[],
		scheduling_index: doc.scheduling_index,
		message: doc.message,
		attachments: doc.attachments,
		shared_contact_cards: doc.shared_contact_cards,
		polls: doc.polls,
		active: doc.active,
		random_string: doc.random_string,
		title: doc.title,
		description: doc.description,
		dates: doc.dates,
		daily_count: doc.daily_count,
		start_time: doc.start_time,
		end_time: doc.end_time,
	};
}

export default class RepetitiveSchedulerService extends UserService {
	public constructor(user: IUser) {
		super(user);
	}

	public async allScheduler() {
		const scheduler = await RepetitiveSchedulerDB.find({
			user: this.getUserId(),
		}).populate('attachments');
		return scheduler.map(formatDoc);
	}

	public async schedulerByID(id: Types.ObjectId) {
		const scheduler = await RepetitiveSchedulerDB.findById(id).populate('attachments');

		if (!scheduler) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}

		return formatDoc(scheduler);
	}

	public createScheduler(data: {
		title: string;
		description: string;
		recipients: string[];
		recipient_from: string;
		recipient_data: string | string[];
		random_string: boolean;
		message: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: IUpload[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
		dates: string[];
		daily_count: number;
		start_time: string;
		end_time: string;
	}) {
		const scheduler = new RepetitiveSchedulerDB({
			...data,
			active: true,
			user: this.getUserId(),
		});

		scheduler.save();
		return formatDoc(scheduler);
	}

	public async modifyScheduler(
		id: Types.ObjectId,
		data: {
			title: string;
			description: string;
			recipients: string[];
			recipient_from: string;
			recipient_data: string | string[];
			random_string: boolean;
			message: string;
			shared_contact_cards: Types.ObjectId[];
			attachments: IUpload[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
			dates: string[];
			daily_count: number;
			start_time: string;
			end_time: string;
		}
	) {
		const scheduler = await RepetitiveSchedulerDB.findById(id).populate('attachments');
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
		if (data.recipients) {
			scheduler.recipients = data.recipients;
		}
		if (data.recipient_from) {
			scheduler.recipient_from = data.recipient_from;
		}
		if (data.recipient_data) {
			scheduler.recipient_data = data.recipient_data as any;
		}
		if (data.attachments) {
			scheduler.attachments = data.attachments;
		}
		if (data.attachments) {
			scheduler.attachments = data.attachments;
		}
		if (data.polls) {
			scheduler.polls = data.polls;
		}
		if (data.daily_count) {
			scheduler.daily_count = data.daily_count;
		}
		if (data.start_time) {
			scheduler.start_time = data.start_time;
		}
		if (data.end_time) {
			scheduler.end_time = data.end_time;
		}
		scheduler.random_string = data.random_string;
		scheduler.shared_contact_cards = await ContactCardDB.find({
			_id: { $in: data.shared_contact_cards },
		});

		await scheduler.save();

		return formatDoc(scheduler);
	}

	public async toggleActive(id: Types.ObjectId) {
		const scheduler = await RepetitiveSchedulerDB.findById(id);
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
		return formatDoc(scheduler);
	}

	public async resume(id: Types.ObjectId) {
		const scheduler = await RepetitiveSchedulerDB.findById(id);
		if (!scheduler) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		scheduler.active = true;
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
		scheduler.save();
	}

	public async pauseAll() {
		const schedulers = await RepetitiveSchedulerDB.find({
			user: this.getUserId(),
		});
		if (schedulers.length === 0) {
			return;
		}
		const ids = schedulers.map((e) => e._id);
		await MessageDB.updateMany(
			{
				'scheduled_by.id': {
					$in: ids,
				},
				status: MESSAGE_STATUS.PAUSED,
			},
			{
				$set: {
					status: MESSAGE_STATUS.PENDING,
				},
			}
		);
		await RepetitiveSchedulerDB.updateMany(
			{
				_id: {
					$in: ids,
				},
			},
			{
				active: false,
			}
		);
		return schedulers.filter((c) => c.active).map((c) => c._id.toString()) as string[];
	}

	public async delete(id: Types.ObjectId) {
		await RepetitiveSchedulerDB.deleteOne({ _id: id });
	}

	public async generateReport(id: Types.ObjectId) {
		const scheduler = await RepetitiveSchedulerDB.findById(id);
		if (!scheduler) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		const messages = await MessageDB.find({
			'scheduled_by.id': id,
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
		const scheduler = await RepetitiveSchedulerDB.findById(id).populate(
			'attachments shared_contact_cards'
		);
		if (!scheduler) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}

		await RepetitiveSchedulerService.scheduleMessagesByDoc(scheduler);
	}

	public static async scheduleMessagesByDoc(scheduler: IRepetitiveScheduler) {
		const schedulerService = new MessageService(scheduler.user);
		const totalTimeInSec = DateUtils.getMoment(scheduler.end_time, 'HH:mm').diff(
			DateUtils.getMoment(scheduler.start_time, 'HH:mm'),
			'seconds'
		);

		const daily_count = scheduler.daily_count;

		const timeGenerator = new TimeGenerator({
			min_delay: 2,
			max_delay: totalTimeInSec / daily_count,
			batch_size: 99999,
			batch_delay: 1,
			startDate: DateUtils.getMomentNow().format('YYYY-MM-DD'),
			startTime: scheduler.start_time,
			endTime: scheduler.end_time,
		});

		let scheduling_index = scheduler.scheduling_index ?? 0;
		const target_index = scheduling_index + daily_count;

		let parsed_csv: { [key: string]: string; number: string }[] | null = [];
		let headers: string[] = [];

		if (scheduler.recipient_from === 'CSV') {
			const uploadDoc = await UploadDB.findById(
				scheduler.recipient_data as unknown as Types.ObjectId
			);

			if (!uploadDoc) {
				return;
			}

			parsed_csv = await FileUtils.readCSV(uploadDoc.filename);

			if (!parsed_csv) {
				return;
			}
			headers = uploadDoc.headers;
		}

		const variablesRecords = parsed_csv.reduce((acc, row) => {
			acc[row.number] = row;
			return acc;
		}, {} as { [key: string]: { [key: string]: string; number: string } });

		while (scheduling_index < target_index) {
			const recipient = scheduler.recipients[scheduling_index % scheduler.recipients.length];
			const record = variablesRecords[recipient];
			let _message = scheduler.message;

			for (const variable of headers) {
				_message = _message.replace(new RegExp(`{{${variable}}}`, 'g'), record[variable] ?? '');
			}
			if (_message.length > 0 && scheduler.random_string) {
				_message += randomMessageText();
			}

			schedulerService.scheduleMessage(
				{
					receiver: `${recipient}@c.us`,
					sendAt: timeGenerator.next().value,
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
					scheduled_by: MESSAGE_SCHEDULER_TYPE.REPETITIVE_SCHEDULER,
					scheduler_id: scheduler._id,
				}
			);
		}
		scheduling_index = target_index % scheduler.recipients.length;

		scheduler.scheduling_index = scheduling_index;
		await scheduler.save();
	}

	public static async scheduleDailyMessages() {
		const schedulers = await RepetitiveSchedulerDB.find({
			active: true,
			dates: { $in: [DateUtils.getMomentNow().format('YYYY-MM-DD')] },
		}).populate('attachments shared_contact_cards');

		for (const scheduler of schedulers) {
			this.scheduleMessagesByDoc(scheduler);
		}
	}
}
