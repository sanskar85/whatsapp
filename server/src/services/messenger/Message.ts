import fs from 'fs';
import { Types } from 'mongoose';
import Logger from 'n23-logger';
import { MessageMedia, Poll } from 'whatsapp-web.js';
import { ATTACHMENTS_PATH, MESSAGE_SCHEDULER_TYPE, MESSAGE_STATUS } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { MessageDB } from '../../repository/messenger';
import UploadDB from '../../repository/uploads';
import { IMessage } from '../../types/messenger';
import { IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import TokenService from '../token';

export type Message = {
	receiver: string;
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
	sendAt: Date;
};

type MessageSchedulerOptions = {
	scheduled_by: MESSAGE_SCHEDULER_TYPE;
	scheduler_id: Types.ObjectId;
};

type TextMessage = string;

export default class MessageService {
	private user: IUser;

	public constructor(user: IUser) {
		this.user = user;
	}

	scheduleMessage(message: Message, opts: MessageSchedulerOptions) {
		const msg = new MessageDB({
			sender: this.user,
			receiver: message.receiver,
			message: message.message ?? '',
			attachments: message.attachments ?? [],
			shared_contact_cards: message.shared_contact_cards ?? [],
			polls: message.polls ?? [],
			sendAt: message.sendAt,
			scheduled_by: {
				type: opts.scheduled_by,
				id: opts.scheduler_id,
			},
		});
		msg.save();
		return msg;
	}

	static async isAttachmentInUse(id: Types.ObjectId) {
		const attachment = await UploadDB.findById(id);
		if (!attachment) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		const messages: IMessage[] = await MessageDB.aggregate([
			{
				$match: {
					attachments: {
						$elemMatch: {
							filename: attachment.filename,
						},
					},
					status: { $in: [MESSAGE_STATUS.PAUSED, MESSAGE_STATUS.PENDING] },
				},
			},
		]);
		return messages.length > 0;
	}

	async scheduleLeadNurturingMessage(messages: Message[], opts: MessageSchedulerOptions) {
		for (const message of messages) {
			await MessageDB.create({
				sender: this.user,
				receiver: message.receiver,
				message: message.message,
				attachments: message.attachments ?? [],
				shared_contact_cards: message.shared_contact_cards ?? [],
				polls: message.polls ?? [],
				sendAt: message.sendAt,
				scheduled_by: {
					type: opts.scheduled_by,
					id: opts.scheduler_id,
				},
			});
		}
	}

	static async sendScheduledMessage() {
		const scheduledMessages = await MessageDB.find({
			sendAt: { $lte: DateUtils.getMomentNow().toDate() },
			status: MESSAGE_STATUS.PENDING,
		}).populate('attachments sender shared_contact_cards');

		const message_ids = scheduledMessages.map((msg) => msg._id);

		await MessageDB.updateMany(
			{ _id: { $in: message_ids } },
			{
				$set: {
					status: MESSAGE_STATUS.SENDING,
				},
			}
		);

		const { message_1: PROMOTIONAL_MESSAGE_1, message_2: PROMOTIONAL_MESSAGE_2 } =
			await TokenService.getPromotionalMessage();

		scheduledMessages.forEach(async (msg) => {
			const cid = WhatsappProvider.clientByUser(msg.sender._id);
			if (!cid) {
				msg.sendAt = DateUtils.getMoment(msg.sendAt).add(1, 'hour').toDate();
				msg.save();
				return;
			}
			const whatsapp = WhatsappProvider.clientByClientID(cid)!;

			const deviceService = whatsapp.getDeviceService()!;
			const { isSubscribed, isNew } = deviceService.isSubscribed();

			if (!isSubscribed && !isNew) {
				msg.status = MESSAGE_STATUS.FAILED;
				msg.save();
				return null;
			}
			let message = msg.message;
			msg.status = MESSAGE_STATUS.SENT;
			msg.sendAt = DateUtils.getMomentNow().toDate();
			await msg.save();

			if (message) {
				whatsapp
					.getClient()
					.sendMessage(msg.receiver, message)
					.catch((err) => {
						msg.status = MESSAGE_STATUS.FAILED;
						msg.save();
						Logger.error('Error sending message:', err);
					});
			}

			msg.shared_contact_cards.forEach(async (card) => {
				whatsapp
					.getClient()
					.sendMessage(msg.receiver, card.vCardString)
					.catch((err) => {
						msg.status = MESSAGE_STATUS.FAILED;
						msg.save();
						Logger.error('Error sending message:', err);
					});
			});

			msg.attachments.forEach(async (attachment) => {
				const { filename, caption, name } = attachment;
				const path = __basedir + ATTACHMENTS_PATH + filename;
				if (!fs.existsSync(path)) {
					return null;
				}

				const media = MessageMedia.fromFilePath(path);
				if (name) {
					media.filename = name + path.substring(path.lastIndexOf('.'));
				}
				whatsapp
					.getClient()
					.sendMessage(msg.receiver, media, {
						caption,
					})
					.catch((err) => {
						msg.status = MESSAGE_STATUS.FAILED;
						msg.save();
						Logger.error('Error sending message:', err);
					});
			});

			msg.polls.forEach(async (poll) => {
				const { title, options, isMultiSelect } = poll;
				whatsapp
					.getClient()
					.sendMessage(
						msg.receiver,
						new Poll(title, options, {
							allowMultipleAnswers: isMultiSelect,
						})
					)
					.catch((err) => {
						msg.status = MESSAGE_STATUS.FAILED;
						msg.save();
						Logger.error('Error sending message:', err);
					});
			});

			if (msg.shared_contact_cards && msg.shared_contact_cards.length > 0) {
				if (PROMOTIONAL_MESSAGE_2) {
					whatsapp
						.getClient()
						.sendMessage(msg.receiver, PROMOTIONAL_MESSAGE_2)
						.catch((err) => {
							msg.status = MESSAGE_STATUS.FAILED;
							msg.save();
							Logger.error('Error sending message:', err);
						});
				}
			} else if (!isSubscribed && isNew) {
				if (PROMOTIONAL_MESSAGE_1) {
					whatsapp
						.getClient()
						.sendMessage(msg.receiver, PROMOTIONAL_MESSAGE_1)
						.catch((err) => {
							msg.status = MESSAGE_STATUS.FAILED;
							msg.save();
							Logger.error('Error sending message:', err);
						});
				}
			}
		});
	}
}
