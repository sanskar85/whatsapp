import fs from 'fs';
import { Types } from 'mongoose';
import Logger from 'n23-logger';
import WAWebJS, { MessageMedia, Poll } from 'whatsapp-web.js';
import { ATTACHMENTS_PATH, BOT_TRIGGER_OPTIONS, BOT_TRIGGER_TO } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { BotResponseDB } from '../../repository/bot';
import BotDB from '../../repository/bot/Bot';
import ContactCardDB from '../../repository/contact-cards';
import TimeGenerator from '../../structures/TimeGenerator';
import IUpload from '../../types/uploads';
import { IUser } from '../../types/user';
import DateUtils from '../../utils/DateUtils';
import { Delay } from '../../utils/ExpressUtils';
import VCardBuilder from '../../utils/VCardBuilder';
import { MessageService } from '../messenger';
import TokenService from '../token';
import UploadService from '../uploads';
import UserService from '../user';

export default class BotService {
	private user: IUser;
	private userService: UserService;
	private messageSchedulerService: MessageService;
	private whatsapp: WhatsappProvider | undefined;

	public constructor(user: IUser) {
		this.user = user;
		this.userService = new UserService(user);
		this.messageSchedulerService = new MessageService(user);
	}

	public attachWhatsappProvider(whatsapp_provider: WhatsappProvider) {
		this.whatsapp = whatsapp_provider;
	}

	public async allBots() {
		const bots = await BotDB.find({
			user: this.user,
		}).populate('attachments shared_contact_cards');
		return bots.map((bot) => ({
			bot_id: bot._id as Types.ObjectId,
			respond_to: bot.respond_to,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			message: bot.message,
			attachments: bot.attachments.map((attachment) => ({
				id: attachment._id,
				name: attachment.name,
				filename: attachment.filename,
				caption: attachment.caption,
			})),
			polls: bot.polls.map((poll) => ({
				title: poll.title,
				options: poll.options,
				isMultiSelect: poll.isMultiSelect,
			})),
			shared_contact_cards: bot.shared_contact_cards ?? [],
			nurturing: (bot.nurturing ?? []).map((el) => ({
				message: el.message,
				after: el.after,
				start_from: el.start_from,
				end_at: el.end_at,
				shared_contact_cards: el.shared_contact_cards ?? [],
				attachments: el.attachments ?? [],
				polls: (el.polls ?? []).map((poll) => ({
					title: poll.title,
					options: poll.options,
					isMultiSelect: poll.isMultiSelect,
				})),
			})),
			forward: bot.forward ?? { number: '', message: '' },
			group_respond: bot.group_respond,
			isActive: bot.active,
		}));
	}

	public async boyByID(id: Types.ObjectId) {
		const bot = await BotDB.findById(id).populate('attachments shared_contact_cards');

		if (!bot) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}

		return {
			bot_id: bot._id as Types.ObjectId,
			respond_to: bot.respond_to,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			message: bot.message,
			attachments: bot.attachments.map((attachment) => ({
				id: attachment._id,
				name: attachment.name,
				filename: attachment.filename,
				caption: attachment.caption,
			})),
			polls: bot.polls.map((poll) => ({
				title: poll.title,
				options: poll.options,
				isMultiSelect: poll.isMultiSelect,
			})),
			nurturing: (bot.nurturing ?? []).map((el) => ({
				...el,
				shared_contact_cards: el.shared_contact_cards ?? [],
				attachments: el.attachments ?? [],
				polls: (el.polls ?? []).map((poll) => ({
					title: poll.title,
					options: poll.options,
					isMultiSelect: poll.isMultiSelect,
				})),
			})),
			shared_contact_cards: bot.shared_contact_cards ?? [],
			isActive: bot.active,
		};
	}

	private async activeBots() {
		const bots = await this.allBots();
		return bots.filter((bot) => bot.isActive);
	}

	private async lastMessages(ids: Types.ObjectId[], recipient: string) {
		const responses = await BotResponseDB.find({
			user: this.user,
			recipient,
			bot: { $in: ids },
		});

		return responses.reduce(
			(acc, item) => {
				let diff = DateUtils.getMoment(item.last_message).diff(DateUtils.getMomentNow(), 'seconds');
				diff = Math.abs(diff);
				const bot_id = item.bot.toString();
				acc[bot_id] = acc[bot_id] ? Math.min(diff, acc[bot_id]) : diff;
				return acc;
			},
			{} as {
				[key: string]: number;
			}
		);
	}

	private async botsEngaged({
		message_from,
		message_body,
		contact,
	}: {
		message_from: string;
		message_body: string;
		contact: WAWebJS.Contact;
	}) {
		const bots = await this.activeBots();
		const last_messages = await this.lastMessages(
			bots.map((bot) => bot.bot_id),
			message_from
		);

		return bots.filter((bot) => {
			const is_recipient =
				bot.respond_to === BOT_TRIGGER_TO.ALL ||
				(bot.respond_to === BOT_TRIGGER_TO.SAVED_CONTACTS && contact.isMyContact) ||
				(bot.respond_to === BOT_TRIGGER_TO.NON_SAVED_CONTACTS && !contact.isMyContact);

			if (!is_recipient) {
				return false;
			}
			if (bot.trigger_gap_seconds > 0) {
				const last_message_time = last_messages[bot.bot_id.toString()];
				if (!isNaN(last_message_time) && last_message_time <= bot.trigger_gap_seconds) {
					return false;
				}
			}
			if (bot.trigger === '') {
				return true;
			}
			if (bot.options === BOT_TRIGGER_OPTIONS.EXACT_IGNORE_CASE) {
				return message_body.toLowerCase() === bot.trigger.toLowerCase();
			}
			if (bot.options === BOT_TRIGGER_OPTIONS.EXACT_MATCH_CASE) {
				return message_body === bot.trigger;
			}

			if (bot.options === BOT_TRIGGER_OPTIONS.INCLUDES_IGNORE_CASE) {
				const lowerCaseSentence = bot.trigger.toLowerCase();
				const lowerCaseParagraph = message_body.toLowerCase();

				// Split the paragraph into words
				const words_paragraph = lowerCaseParagraph.split(/\s+/);
				const sentence_paragraph = lowerCaseSentence.split(/\s+/);

				return words_paragraph.some(
					(_, index, arr) =>
						arr.slice(index, index + sentence_paragraph.length).join() === sentence_paragraph.join()
				);
			}
			if (bot.options === BOT_TRIGGER_OPTIONS.INCLUDES_MATCH_CASE) {
				const lowerCaseSentence = bot.trigger;
				const lowerCaseParagraph = message_body;

				// Split the paragraph into words
				const words_paragraph = lowerCaseParagraph.split(/\s+/);
				const sentence_paragraph = lowerCaseSentence.split(/\s+/);

				return words_paragraph.some(
					(_, index, arr) =>
						arr.slice(index, index + sentence_paragraph.length).join() === sentence_paragraph.join()
				);
			}

			return false;
		});
	}

	public async handleMessage(
		triggered_from: string,
		body: string,
		contact: WAWebJS.Contact,
		opts: {
			isGroup: boolean;
			fromPoll: boolean;
		} = {
			isGroup: false,
			fromPoll: false,
		}
	) {
		if (!this.whatsapp) {
			throw new Error('Whatsapp Provider not attached.');
		}

		const { isSubscribed, isNew } = this.userService.isSubscribed();
		if (!isSubscribed && !isNew) {
			return;
		}

		const { message_1: PROMOTIONAL_MESSAGE_1, message_2: PROMOTIONAL_MESSAGE_2 } =
			await TokenService.getPromotionalMessage();

		const message_from = triggered_from.split('@')[0];

		const botsEngaged = await this.botsEngaged({ message_body: body, message_from, contact });

		const whatsapp = this.whatsapp;

		botsEngaged.forEach(async (bot) => {
			if (!bot.group_respond && opts.isGroup) {
				return;
			}
			await Delay(bot.response_delay_seconds);
			this.responseSent(bot.bot_id, message_from);

			let msg = bot.message;
			if (msg) {
				if (msg.includes('{{public_name}}')) {
					msg = msg.replace('{{public_name}}', contact.pushname);
				}
				whatsapp
					.getClient()
					.sendMessage(triggered_from, msg)
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});
			}

			for (const mediaObject of bot.attachments) {
				const path = __basedir + ATTACHMENTS_PATH + mediaObject.filename;
				if (!fs.existsSync(path)) {
					continue;
				}
				const media = MessageMedia.fromFilePath(path);
				if (mediaObject.name) {
					media.filename = mediaObject.name + path.substring(path.lastIndexOf('.'));
				}
				whatsapp
					.getClient()
					.sendMessage(triggered_from, media, {
						caption: mediaObject.caption,
					})
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});
			}

			(bot.shared_contact_cards ?? []).forEach(async (card) => {
				whatsapp
					.getClient()
					.sendMessage(triggered_from, card.vCardString)
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});
			});

			(bot.polls ?? []).forEach(async (poll) => {
				const { title, options, isMultiSelect } = poll;
				whatsapp
					.getClient()
					.sendMessage(
						triggered_from,
						new Poll(title, options, {
							allowMultipleAnswers: isMultiSelect,
						})
					)
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});
			});

			if (bot.shared_contact_cards.length > 0) {
				whatsapp
					.getClient()
					.sendMessage(triggered_from, PROMOTIONAL_MESSAGE_2)
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});
			} else if (!isSubscribed && isNew) {
				whatsapp
					.getClient()
					.sendMessage(triggered_from, PROMOTIONAL_MESSAGE_1)
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});
			}

			if (bot.forward.number) {
				const vCardString = new VCardBuilder({})
					.setFirstName(contact.name ?? contact.pushname)
					.setContactPhone(`+${contact.id.user}`, contact.id.user)
					.build();

				whatsapp
					.getClient()
					.sendMessage(bot.forward.number + '@c.us', vCardString)
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});

				if (bot.forward.message) {
					const _variable = '{{public_name}}';
					const custom_message = bot.forward.message.replace(
						_variable,
						(contact.pushname || contact.name) ?? ''
					);
					whatsapp
						.getClient()
						.sendMessage(bot.forward.number + '@c.us', custom_message)
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				}
			}

			if (bot.nurturing.length > 0) {
				const dateGenerator = new TimeGenerator({
					batch_size: 1,
				});
				const nurtured_messages = bot.nurturing.map((el) => {
					const _variable = '{{public_name}}';
					const custom_message = el.message.replace(
						new RegExp(_variable, 'g'),
						(contact.pushname || contact.name) ?? ''
					);
					dateGenerator.setStartTime(el.start_from).setEndTime(el.end_at);
					return {
						receiver: triggered_from,
						message: custom_message,
						sendAt: dateGenerator.next(el.after).value,
						shared_contact_cards: el.shared_contact_cards as unknown as Types.ObjectId[],
						polls: el.polls,
						attachments: el.attachments.map((el) => ({
							name: el.name,
							filename: el.filename,
							caption: el.caption,
						})),
					};
				});
				this.messageSchedulerService.scheduleLeadNurturingMessage(nurtured_messages);
			}
		});
	}

	private async responseSent(
		bot_id: Types.ObjectId,
		message_from: string,
		opts: {
			fromPoll: boolean;
		} = {
			fromPoll: false,
		}
	) {
		const bot_response = await BotResponseDB.findOne({
			user: this.user,
			recipient: message_from,
			bot: bot_id,
		});

		if (bot_response) {
			bot_response.last_message = DateUtils.getMomentNow().toDate();
			bot_response.triggered_at[opts.fromPoll ? 'POLL' : 'BOT'].push(bot_response.last_message);
			await bot_response.save();
		} else {
			await BotResponseDB.create({
				user: this.user,
				recipient: message_from,
				bot: bot_id,
				last_message: DateUtils.getMomentNow().toDate(),
				triggered_at: [DateUtils.getMomentNow().toDate()],
			});
		}
	}

	public createBot(data: {
		respond_to: BOT_TRIGGER_TO;
		trigger_gap_seconds: number;
		response_delay_seconds: number;
		options: BOT_TRIGGER_OPTIONS;
		trigger: string;
		message: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: IUpload[];
		group_respond: boolean;
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
		forward: {
			number: string;
			message: string;
		};
		nurturing: {
			message: string;
			after: number;
			start_from: string;
			end_at: string;
			shared_contact_cards?: Types.ObjectId[];
			attachments?: Types.ObjectId[];
			polls?: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		}[];
	}) {
		const bot = new BotDB({
			...data,
			user: this.user,
		});

		bot.save();
		return {
			bot_id: bot._id as Types.ObjectId,
			respond_to: bot.respond_to,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			message: bot.message,
			attachments: data.attachments.map((attachment) => ({
				id: attachment._id,
				filename: attachment.filename,
				caption: attachment.caption,
			})),
			nurturing: bot.nurturing ?? [],
			shared_contact_cards: bot.shared_contact_cards ?? [],
			polls: bot.polls,
			forward: bot.forward ?? { number: '', message: '' },
			isActive: bot.active,
		};
	}

	public async modifyBot(
		id: Types.ObjectId,
		data: {
			respond_to?: BOT_TRIGGER_TO;
			trigger_gap_seconds?: number;
			response_delay_seconds?: number;
			options?: BOT_TRIGGER_OPTIONS;
			trigger?: string;
			message?: string;
			shared_contact_cards?: Types.ObjectId[];
			attachments?: IUpload[];
			polls?: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
			forward?: {
				number: string;
				message: string;
			};
			nurturing?: {
				message: string;
				after: number;
				start_from: string;
				end_at: string;
				shared_contact_cards?: Types.ObjectId[];
				attachments?: Types.ObjectId[];
				polls?: {
					title: string;
					options: string[];
					isMultiSelect: boolean;
				}[];
			}[];
		}
	) {
		const bot = await BotDB.findById(id).populate('attachments shared_contact_cards');
		const uploadService = new UploadService(this.user);
		if (!bot) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		if (data.respond_to) {
			bot.respond_to = data.respond_to;
		}
		if (data.trigger) {
			bot.trigger = data.trigger;
		}
		if (data.respond_to) {
			bot.respond_to = data.respond_to;
		}
		if (data.trigger_gap_seconds) {
			bot.trigger_gap_seconds = data.trigger_gap_seconds;
		}
		if (data.response_delay_seconds) {
			bot.response_delay_seconds = data.response_delay_seconds;
		}
		if (data.options) {
			bot.options = data.options;
		}
		if (data.message) {
			bot.message = data.message;
		}
		if (data.attachments) {
			bot.attachments = data.attachments;
		}
		if (data.forward) {
			bot.forward = data.forward;
		}
		if (data.polls) {
			bot.polls = data.polls;
		}
		if (data.nurturing) {
			bot.nurturing = await Promise.all(
				data.nurturing.map(async (el) => {
					const [_, attachments] = await uploadService.listAttachments(el.attachments);
					const contacts = await ContactCardDB.find({
						_id: { $in: el.shared_contact_cards },
					});
					return {
						...el,
						shared_contact_cards: contacts,
						attachments,
					};
				})
			);
		}
		bot.shared_contact_cards = await ContactCardDB.find({
			_id: { $in: data.shared_contact_cards },
		});

		await bot.save();

		return {
			bot_id: bot._id as Types.ObjectId,
			respond_to: bot.respond_to,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			message: bot.message,
			attachments: bot.attachments.map((attachment) => ({
				id: attachment._id,
				filename: attachment.filename,
				caption: attachment.caption,
			})),
			nurturing: bot.nurturing ?? [],
			shared_contact_cards: bot.shared_contact_cards ?? [],
			polls: bot.polls ?? [],
			forward: bot.forward ?? { number: '', message: '' },
			isActive: bot.active,
			group_respond: bot.group_respond,
		};
	}

	public async toggleActive(bot_id: Types.ObjectId) {
		const bot = await BotDB.findById(bot_id);
		if (!bot) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		bot.active = !bot.active;
		bot.save();
		return {
			bot_id: bot._id as Types.ObjectId,
			respond_to: bot.respond_to,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			message: bot.message,
			attachments: bot.attachments.map((attachment) => ({
				id: attachment._id,
				filename: attachment.filename,
				caption: attachment.caption,
			})),
			nurturing: bot.nurturing ?? [],
			shared_contact_cards: bot.shared_contact_cards ?? [],
			polls: bot.polls ?? [],
			forward: bot.forward ?? { number: '', message: '' },
			isActive: bot.active,
			group_respond: bot.group_respond,
		};
	}

	public async deleteBot(bot_id: Types.ObjectId) {
		await BotDB.deleteOne({ _id: bot_id });
		await BotResponseDB.deleteMany({ bot: bot_id });
	}

	public async botResponses(bot_id: Types.ObjectId) {
		const bot = await BotDB.findById(bot_id);
		const responses = await BotResponseDB.find({ bot: bot_id });
		if (!bot) {
			return [];
		}
		const result: {
			trigger: string;
			recipient: string;
			triggered_at: string;
			triggered_by: string;
		}[] = [];
		responses.forEach((response) => {
			response.triggered_at.BOT.forEach((triggered_at) => {
				result.push({
					trigger: bot.trigger,
					recipient: response.recipient,
					triggered_at: DateUtils.getMoment(triggered_at).format('DD-MM-YYYY HH:mm:ss'),
					triggered_by: 'BOT',
				});
			});
			response.triggered_at.POLL.forEach((triggered_at) => {
				result.push({
					trigger: bot.trigger,
					recipient: response.recipient,
					triggered_at: DateUtils.getMoment(triggered_at).format('DD-MM-YYYY HH:mm:ss'),
					triggered_by: 'POLL',
				});
			});
		});
		return result;
	}
}
