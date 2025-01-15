import fs from 'fs';
import { Types } from 'mongoose';
import Logger from 'n23-logger';
import WAWebJS, { MessageMedia, Poll } from 'whatsapp-web.js';
import { ATTACHMENTS_PATH, BOT_TRIGGER_OPTIONS, MESSAGE_SCHEDULER_TYPE } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { BotResponseDB } from '../../repository/bot';
import BotDB from '../../repository/bot/Bot';
import ContactCardDB from '../../repository/contact-cards';
import TimeGenerator from '../../structures/TimeGenerator';
import IUpload from '../../types/uploads';
import { IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import { Delay, randomMessageText, randomVector } from '../../utils/ExpressUtils';
import VCardBuilder from '../../utils/VCardBuilder';
import WhatsappUtils from '../../utils/WhatsappUtils';
import { MessageService } from '../messenger';
import TokenService from '../token';
import UploadService from '../uploads';
import UserService from '../user/user';
import UserPreferencesService from '../user/userPreferences';

export default class BotService extends UserService {
	private messageSchedulerService: MessageService;
	private handledBotPerUser: Set<string> = new Set();

	public constructor(user: IUser) {
		super(user);
		this.messageSchedulerService = new MessageService(user);
	}

	public async allBots() {
		const bots = await BotDB.find({
			user: this.getUser(),
		}).populate('attachments shared_contact_cards ');
		return bots.map((bot) => ({
			bot_id: bot._id as Types.ObjectId,
			recipient: bot.recipient,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			random_string: bot.random_string,
			message: bot.message,
			startAt: bot.startAt,
			endAt: bot.endAt,
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
				random_string: el.random_string,
			})),
			forward: bot.forward ?? { number: '', message: '' },
			group_respond: bot.group_respond,
			isActive: bot.active,
			allowed_country_codes: bot.allowed_country_codes ?? [],
		}));
	}

	public async boyByID(id: Types.ObjectId) {
		const bot = await BotDB.findById(id).populate('attachments shared_contact_cards');

		if (!bot) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}

		return {
			bot_id: bot._id as Types.ObjectId,
			recipient: bot.recipient,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			random_string: bot.random_string,
			message: bot.message,
			startAt: bot.startAt,
			endAt: bot.endAt,
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
				random_string: el.random_string,
			})),
			shared_contact_cards: bot.shared_contact_cards ?? [],
			isActive: bot.active,
			allowed_country_codes: bot.allowed_country_codes ?? [],
		};
	}

	private async activeBots() {
		const bots = await this.allBots();
		return bots.filter((bot) => bot.isActive);
	}

	private async lastMessages(ids: Types.ObjectId[], recipient: string) {
		const responses = await BotResponseDB.find({
			user: this.getUser(),
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

		let filtered_bots = await Promise.all(
			bots.map(async (bot) => {
				const country_code = await WhatsappUtils.getCountryCode(contact);

				if (
					bot.allowed_country_codes.length > 0 &&
					!bot.allowed_country_codes.includes(country_code)
				) {
					return null;
				}
				return bot;
			})
		);
		filtered_bots = await Promise.all(
			filtered_bots.filter((bot) => {
				if (!bot) {
					return false;
				}

				if (!DateUtils.isTimeBetween(bot.startAt, bot.endAt, DateUtils.getMomentNow())) {
					return false;
				}

				if (bot.trigger_gap_seconds > 0) {
					const last_message_time = last_messages[bot.bot_id.toString()];
					if (!isNaN(last_message_time) && last_message_time <= bot.trigger_gap_seconds) {
						return false;
					}
				}

				if (
					bot.recipient.exclude.length > 0 &&
					bot.recipient.exclude.includes(contact.id._serialized)
				) {
					return false;
				}

				if (bot.recipient.include.length > 0) {
					if (!bot.recipient.include.includes(contact.id._serialized)) {
						return false;
					}
				} else {
					const is_recipient =
						(bot.recipient.saved && contact.isMyContact) ||
						(bot.recipient.unsaved && !contact.isMyContact);

					if (!is_recipient) {
						return false;
					}
				}

				if (bot.trigger.length === 0) {
					return true;
				}

				let cond = false;

				for (const trigger of bot.trigger) {
					if (bot.options === BOT_TRIGGER_OPTIONS.EXACT_IGNORE_CASE) {
						cond = cond || message_body.toLowerCase() === trigger.toLowerCase();
					}
					if (bot.options === BOT_TRIGGER_OPTIONS.EXACT_MATCH_CASE) {
						cond = cond || message_body === trigger;
					}

					if (bot.options === BOT_TRIGGER_OPTIONS.INCLUDES_IGNORE_CASE) {
						const lowerCaseSentence = trigger.toLowerCase();
						const lowerCaseParagraph = message_body.toLowerCase();

						// Split the paragraph into words
						const words_paragraph = lowerCaseParagraph.split(/\s+/);
						const sentence_paragraph = lowerCaseSentence.split(/\s+/);

						cond =
							cond ||
							words_paragraph.some(
								(_, index, arr) =>
									arr.slice(index, index + sentence_paragraph.length).join() ===
									sentence_paragraph.join()
							);
					}
					if (bot.options === BOT_TRIGGER_OPTIONS.INCLUDES_MATCH_CASE) {
						const lowerCaseSentence = trigger;
						const lowerCaseParagraph = message_body;

						// Split the paragraph into words
						const words_paragraph = lowerCaseParagraph.split(/\s+/);
						const sentence_paragraph = lowerCaseSentence.split(/\s+/);

						cond =
							cond ||
							words_paragraph.some(
								(_, index, arr) =>
									arr.slice(index, index + sentence_paragraph.length).join() ===
									sentence_paragraph.join()
							);
					}
					if (bot.options === BOT_TRIGGER_OPTIONS.ANYWHERE_IGNORE_CASE) {
						const lowerCaseSentence = trigger.toLowerCase();
						const lowerCaseParagraph = message_body.toLowerCase();

						// Split the paragraph into words
						const words_paragraph = lowerCaseParagraph.split(/\s+/);
						const sentence_paragraph = lowerCaseSentence.split(/\s+/);

						cond =
							cond ||
							sentence_paragraph.every((word) => {
								const wordIndex = words_paragraph.indexOf(word);
								return wordIndex >= 0;
							});
					}
					if (bot.options === BOT_TRIGGER_OPTIONS.ANYWHERE_MATCH_CASE) {
						const lowerCaseSentence = trigger;
						const lowerCaseParagraph = message_body;

						// Split the paragraph into words
						const words_paragraph = lowerCaseParagraph.split(/\s+/);
						const sentence_paragraph = lowerCaseSentence.split(/\s+/);

						cond =
							cond ||
							sentence_paragraph.every((word) => {
								const wordIndex = words_paragraph.indexOf(word);
								return wordIndex >= 0;
							});
					}
				}

				return cond;
			})
		);
		return filtered_bots.filter((bot) => bot !== null);
	}

	public async handleMessage(
		triggered_from: string,
		body: string,
		contact: WAWebJS.Contact,
		{
			isSubscribed,
			isNew,
			...opts
		}: {
			isGroup?: boolean;
			fromPoll?: boolean;
			message_id?: string;
			client_id: string;
			device_id: Types.ObjectId;
			isSubscribed: boolean;
			isNew: boolean;
		}
	) {
		if (!opts.client_id) {
			return;
		}
		const { message_1: PROMOTIONAL_MESSAGE_1, message_2: PROMOTIONAL_MESSAGE_2 } =
			await TokenService.getPromotionalMessage();

		const message_from = triggered_from.split('@')[0];

		const botsEngaged = await this.botsEngaged({ message_body: body, message_from, contact });
		const uploadService = new UploadService(this.getUser());

		const whatsapp = WhatsappProvider.clientByClientID(opts.client_id);
		if (!whatsapp) {
			return;
		}

		botsEngaged.forEach(async (bot) => {
			if (!bot) {
				return;
			}
			if (!bot.group_respond && (opts.isGroup || message_from.length > 12)) {
				return;
			} else if (this.handledBotPerUser.has(`${message_from}_${bot.bot_id.toString()}`)) {
				return;
			}
			this.responseSent(bot.bot_id, message_from);
			await Delay(bot.response_delay_seconds);
			Logger.info(
				'BOT TRIGGERED',
				JSON.stringify({
					recipient: contact.id._serialized,
					message_text: body,
					chat_id: triggered_from,
					message_id: opts.message_id,
					bot_id: bot.bot_id,
				})
			);
			const userPrefService = await UserPreferencesService.getService(this.getUserId());

			let msg = bot.message;
			if (msg) {
				if (msg.includes('{{public_name}}')) {
					msg = msg.replace('{{public_name}}', contact.pushname);
				}
				if (msg.length > 0 && bot.random_string) {
					msg += randomMessageText();
				}
				whatsapp
					.getClient()
					.sendMessage(triggered_from, msg)
					.then(async (_msg) => {
						if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
							setTimeout(() => {
								_msg.star();
							}, 1000);
						}
					})
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
					.then(async (_msg) => {
						if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
							setTimeout(() => {
								_msg.star();
							}, 1000);
						}
					})
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});
			}

			(bot.shared_contact_cards ?? []).forEach(async (card) => {
				whatsapp
					.getClient()
					.sendMessage(triggered_from, card.vCardString)
					.then(async (_msg) => {
						if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
							setTimeout(() => {
								_msg.star();
							}, 1000);
						}
					})
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
							messageSecret: randomVector(32),
							allowMultipleAnswers: isMultiSelect,
						})
					)
					.then(async (_msg) => {
						if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
							setTimeout(() => {
								_msg.star();
							}, 1000);
						}
						await whatsapp.getClient().interface.openChatWindow(triggered_from);
					})
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});
			});

			if (bot.shared_contact_cards.length > 0) {
				if (PROMOTIONAL_MESSAGE_2) {
					whatsapp
						.getClient()
						.sendMessage(triggered_from, PROMOTIONAL_MESSAGE_2)
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				}
			} else if (!isSubscribed && isNew) {
				if (PROMOTIONAL_MESSAGE_1) {
					whatsapp
						.getClient()
						.sendMessage(triggered_from, PROMOTIONAL_MESSAGE_1)
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				}
			}

			if (bot.forward.number) {
				const vCardString = new VCardBuilder({})
					.setFirstName(contact.name ?? contact.pushname)
					.setContactPhone(`+${contact.id.user}`, contact.id.user)
					.build();

				whatsapp
					.getClient()
					.sendMessage(bot.forward.number + '@c.us', vCardString)
					.then(async (_msg) => {
						if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
							setTimeout(() => {
								_msg.star();
							}, 1000);
						}
					})
					.catch((err) => {
						Logger.error('Error sending message:', err);
					});

				if (bot.forward.message) {
					const _variable = '{{public_name}}';
					const custom_message = bot.forward.message.replace(
						new RegExp(_variable, 'g'),
						(contact.pushname || contact.name) ?? ''
					);
					whatsapp
						.getClient()
						.sendMessage(bot.forward.number + '@c.us', custom_message)
						.then(async (_msg) => {
							if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
						})
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				}
			}

			if (bot.nurturing.length > 0) {
				const dateGenerator = new TimeGenerator({
					batch_size: 1,
					min_delay: 1,
					max_delay: 5,
					batch_delay: 2,
				});
				const nurtured_messages = await Promise.all(
					bot.nurturing.map(async (el) => {
						const _variable = '{{public_name}}';
						let custom_message = el.message.replace(
							new RegExp(_variable, 'g'),
							(contact.pushname || contact.name) ?? ''
						);
						dateGenerator.setStartTime(el.start_from).setEndTime(el.end_at);
						const dateAt = dateGenerator.next(el.after).value;
						const [_attachments] = await uploadService.listAttachments(
							el.attachments as unknown as Types.ObjectId[]
						);

						if (custom_message.length > 0 && el.random_string) {
							custom_message += randomMessageText();
						}

						return {
							receiver: triggered_from,
							message: custom_message,
							sendAt: dateAt,
							shared_contact_cards: el.shared_contact_cards as unknown as Types.ObjectId[],
							polls: el.polls,
							attachments: _attachments.map((el) => ({
								name: el.name,
								filename: el.filename,
								caption: el.caption,
							})),
						};
					})
				);
				this.messageSchedulerService.scheduleLeadNurturingMessage(nurtured_messages, {
					scheduled_by: MESSAGE_SCHEDULER_TYPE.BOT,
					scheduler_id: bot.bot_id,
				});
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
		this.handledBotPerUser.add(`${message_from}_${bot_id.toString()}`);

		setTimeout(() => {
			this.handledBotPerUser.delete(`${message_from}_${bot_id.toString()}`);
		}, 1000 * 60 * 5);

		const bot_response = await BotResponseDB.findOne({
			user: this.getUser(),
			recipient: message_from,
			bot: bot_id,
		});

		if (bot_response) {
			bot_response.last_message = DateUtils.getMomentNow().toDate();
			bot_response.triggered_at[opts.fromPoll ? 'POLL' : 'BOT'].push(bot_response.last_message);
			await bot_response.save();
		} else {
			await BotResponseDB.create({
				user: this.getUser(),
				recipient: message_from,
				bot: bot_id,
				last_message: DateUtils.getMomentNow().toDate(),
				triggered_at: {
					[opts.fromPoll ? 'POLL' : 'BOT']: [DateUtils.getMomentNow().toDate()],
					[opts.fromPoll ? 'BOT' : 'POLL']: [],
				},
			});
		}
	}

	public createBot(data: {
		recipient: {
			include: string[];
			exclude: string[];
			saved: boolean;
			unsaved: boolean;
		};
		trigger_gap_seconds: number;
		response_delay_seconds: number;
		options: BOT_TRIGGER_OPTIONS;
		trigger: string[];
		random_string: boolean;
		message: string;
		startAt: string;
		endAt: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: IUpload[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
		group_respond: boolean;
		forward: {
			number: string;
			message: string;
		};
		nurturing: {
			random_string: boolean;
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
		allowed_country_codes: string[];
	}) {
		const bot = new BotDB({
			...data,
			user: this.getUser(),
		});

		bot.save();
		return {
			bot_id: bot._id as Types.ObjectId,
			recipient: bot.recipient,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			startAt: bot.startAt,
			endAt: bot.endAt,
			random_string: bot.random_string,
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
			allowed_country_codes: bot.allowed_country_codes ?? [],
		};
	}

	public async modifyBot(
		id: Types.ObjectId,
		data: {
			recipient?: {
				saved: boolean;
				unsaved: boolean;
				include: string[];
				exclude: string[];
			};
			trigger_gap_seconds?: number;
			response_delay_seconds?: number;
			options?: BOT_TRIGGER_OPTIONS;
			trigger?: string[];
			startAt?: string;
			endAt?: string;
			random_string: boolean;
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
				random_string: boolean;
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
			allowed_country_codes: string[];
		}
	) {
		const bot = await BotDB.findById(id).populate('attachments shared_contact_cards');
		const uploadService = new UploadService(this.getUser());
		if (!bot) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		if (data.recipient) {
			bot.recipient = data.recipient;
		}
		if (data.trigger) {
			bot.trigger = data.trigger;
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
		if (data.startAt) {
			bot.startAt = data.startAt;
		}
		if (data.endAt) {
			bot.endAt = data.endAt;
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
		if (data.allowed_country_codes !== undefined) {
			bot.allowed_country_codes = data.allowed_country_codes;
		}

		bot.random_string = data.random_string;
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
						random_string: el.random_string,
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
			recipient: bot.recipient,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			startAt: bot.startAt,
			endAt: bot.endAt,
			random_string: bot.random_string,
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
			allowed_country_codes: bot.allowed_country_codes ?? [],
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
			recipient: bot.recipient,
			trigger: bot.trigger,
			trigger_gap_seconds: bot.trigger_gap_seconds,
			response_delay_seconds: bot.response_delay_seconds,
			options: bot.options,
			startAt: bot.startAt,
			endAt: bot.endAt,
			random_string: bot.random_string,
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
			allowed_country_codes: bot.allowed_country_codes ?? [],
		};
	}

	public async pauseAll() {
		await BotDB.updateMany({ user: this.getUserId() }, { active: false });
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
					trigger: bot.trigger.join(', '),
					recipient: response.recipient,
					triggered_at: DateUtils.getMoment(triggered_at).format('DD-MM-YYYY HH:mm:ss'),
					triggered_by: 'BOT',
				});
			});
			response.triggered_at.POLL.forEach((triggered_at) => {
				result.push({
					trigger: bot.trigger.join(', '),
					recipient: response.recipient,
					triggered_at: DateUtils.getMoment(triggered_at).format('DD-MM-YYYY HH:mm:ss'),
					triggered_by: 'POLL',
				});
			});
		});
		return result;
	}
}
