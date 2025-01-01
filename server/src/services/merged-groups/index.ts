import fs from 'fs';
import { Types } from 'mongoose';
import Logger from 'n23-logger';
import WAWebJS, { MessageMedia, Poll } from 'whatsapp-web.js';
import { ATTACHMENTS_PATH, BOT_TRIGGER_OPTIONS } from '../../config/const';
import { GroupPrivateReplyDB, GroupReplyDB } from '../../repository/group-reply';
import MergedGroupDB from '../../repository/merged-groups';
import IContactCard from '../../types/contact-cards';
import IMergedGroup from '../../types/merged-group';
import IPolls from '../../types/polls';
import IUpload from '../../types/uploads';
import { IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import {
	Delay,
	getRandomNumber,
	idValidator,
	randomMessageText,
	randomVector,
} from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';
import VCardBuilder from '../../utils/VCardBuilder';
import WhatsappUtils from '../../utils/WhatsappUtils';
import ContactCardService from '../contact-card';
import { mimeTypes } from '../message-logger';
import TokenService from '../token';
import UploadService from '../uploads';
import { DeviceService } from '../user';
import UserPreferencesService from '../user/userPreferences';

const processGroup = (group: IMergedGroup) => {
	return {
		id: group._id as string,
		name: (group.name as string) ?? '',
		isMergedGroup: true,
		groups: group.groups,
		group_reply_saved: group.group_reply_saved,
		group_reply_unsaved: group.group_reply_unsaved,
		private_reply_saved: group.private_reply_saved,
		private_reply_unsaved: group.private_reply_unsaved,
		private_reply_admin: group.private_reply_admin,
		min_delay: group.min_delay ?? 2,
		max_delay: group.max_delay ?? 7,
		restricted_numbers: group.restricted_numbers ?? [],
		reply_business_only: group.reply_business_only ?? false,
		random_string: group.random_string ?? false,
		active: group.active ?? true,
		canSendAdmin: group.canSendAdmin ?? false,
		multiple_responses: group.multiple_responses ?? false,
		triggers: group.triggers ?? [],
		options: group.options ?? BOT_TRIGGER_OPTIONS.EXACT_MATCH_CASE,
		forward: group.forward,
		start_time: group.start_time ?? '10:00',
		end_time: group.end_time ?? '18:00',
		allowed_country_codes: group.allowed_country_codes ?? [],
		moderator_rules: group.moderation_rules ?? {
			file_types: [],
			group_rule: {
				message: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			},
			creator_rule: {
				message: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			},
			admin_rule: {
				message: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			},
		},
	};
};

type ModeratorRule = {
	message: string;
	shared_contact_cards: Types.ObjectId[];
	attachments: Types.ObjectId[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
};

export default class GroupMergeService {
	private user: IUser;

	public constructor(user: IUser) {
		this.user = user;
	}

	async listGroups() {
		const merged_groups = await MergedGroupDB.find({
			user: this.user,
		});

		return merged_groups.map(processGroup);
	}

	async mergeGroup(
		name: string,
		group_ids: string[],
		details: {
			group_reply_saved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			}[];
			group_reply_unsaved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			}[];
			private_reply_saved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			}[];
			private_reply_unsaved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			}[];
			private_reply_admin: {
				text: string;
				attachments: Types.ObjectId[];
				shared_contact_cards: Types.ObjectId[];
				polls: IPolls[];
			}[];
			allowed_country_codes: string[];
			restricted_numbers?: Types.ObjectId[];
			reply_business_only: boolean;
			random_string: boolean;
			min_delay: number;
			max_delay: number;
			start_time: string;
			end_time: string;
			canSendAdmin: boolean;
			multiple_responses: boolean;
			triggers: string[];
			options: BOT_TRIGGER_OPTIONS;
			forward: {
				number: string;
				message: string;
			};
		}
	) {
		const group = await MergedGroupDB.create({
			user: this.user,
			name,
			groups: group_ids,
			...details,
		});

		return processGroup(group);
	}

	async updateGroup(
		id: Types.ObjectId,
		{ name, group_ids }: { name?: string; group_ids?: string[] },
		details: {
			group_reply_saved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			}[];
			group_reply_unsaved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			}[];
			private_reply_saved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			}[];
			private_reply_unsaved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			}[];
			private_reply_admin: {
				text: string;
				attachments: Types.ObjectId[];
				shared_contact_cards: Types.ObjectId[];
				polls: IPolls[];
			}[];
			allowed_country_codes: string[];
			restricted_numbers?: Types.ObjectId[];
			reply_business_only?: boolean;
			random_string?: boolean;
			min_delay: number;
			max_delay: number;
			start_time: string;
			end_time: string;
			canSendAdmin: boolean;
			multiple_responses: boolean;
			triggers: string[];
			options: BOT_TRIGGER_OPTIONS;
			forward: {
				number: string;
				message: string;
			};
		}
	) {
		let merged_group = await MergedGroupDB.findById(id);

		if (!merged_group) {
			return null;
		}

		await MergedGroupDB.updateOne(
			{ _id: id },
			{
				$set: {
					...(name && { name }),
					...(group_ids && { groups: group_ids }),
					...(details.group_reply_saved && { group_reply_saved: details.group_reply_saved }),
					...(details.group_reply_unsaved && { group_reply_unsaved: details.group_reply_unsaved }),
					...(details.private_reply_saved && { private_reply_saved: details.private_reply_saved }),
					...(details.private_reply_unsaved && {
						private_reply_unsaved: details.private_reply_unsaved,
					}),
					...(details.private_reply_admin && {
						private_reply_admin: details.private_reply_admin,
					}),
					restricted_numbers: details.restricted_numbers,
					...(details.reply_business_only && { reply_business_only: details.reply_business_only }),
					...(details.random_string !== undefined && { random_string: details.random_string }),
					...(details.min_delay && { min_delay: details.min_delay }),
					...(details.max_delay && { max_delay: details.max_delay }),
					...(details.canSendAdmin !== undefined && { canSendAdmin: details.canSendAdmin }),
					...(details.multiple_responses !== undefined && {
						multiple_responses: details.multiple_responses,
					}),
					...(details.triggers && { triggers: details.triggers }),
					...(details.options && { options: details.options }),
					...(details.forward && { forward: details.forward }),
					...(details.start_time && { start_time: details.start_time }),
					...(details.end_time && { end_time: details.end_time }),
					...(details.allowed_country_codes !== undefined && {
						allowed_country_codes: details.allowed_country_codes,
					}),
				},
			}
		);

		merged_group = await MergedGroupDB.findById(id);
		return processGroup(merged_group!);
	}

	async toggleActive(id: Types.ObjectId) {
		const merged_group = await MergedGroupDB.findById(id);

		if (!merged_group) {
			return false;
		}
		await MergedGroupDB.updateOne({ _id: id }, { $set: { active: !merged_group.active } });
		return !merged_group.active;
	}

	async clear(id: Types.ObjectId) {
		await GroupPrivateReplyDB.deleteMany({ mergedGroup: id });
		await GroupReplyDB.deleteMany({ mergedGroup: id });
	}

	async generateReport(id: Types.ObjectId) {
		const private_replies = await GroupPrivateReplyDB.find({ mergedGroup: id });
		const group_replies = await GroupReplyDB.find({ mergedGroup: id });

		return [
			...private_replies.map((doc) => ({
				recipient: doc.from.split('@')[0],
				group_name: doc.group_name,
				reply_type: 'Private Reply',
				repliedAt: DateUtils.getMoment(doc.createdAt).format('DD/MM/YYYY HH:mm:ss'),
			})),
			...group_replies.map((doc) => ({
				recipient: doc.from.split('@')[0],
				group_name: doc.group_name,
				reply_type: 'In Chat Reply',
				repliedAt: DateUtils.getMoment(doc.createdAt).format('DD/MM/YYYY HH:mm:ss'),
			})),
		];
	}

	async deleteGroup(group_id: Types.ObjectId) {
		await MergedGroupDB.deleteOne({ _id: group_id });
	}

	async removeFromGroup(id: Types.ObjectId, group_ids: string[]) {
		const mergedGroup = await MergedGroupDB.findById(id);
		if (!mergedGroup) return;
		mergedGroup.groups = mergedGroup.groups.filter((id) => !group_ids.includes(id));
		await mergedGroup.save();
	}

	async extractWhatsappGroupIds(ids: string | string[]) {
		const searchable_ids = typeof ids === 'string' ? [ids] : ids;

		const { whatsapp_ids, merged_group_ids } = searchable_ids.reduce(
			(acc, id) => {
				if (idValidator(id)[0]) {
					acc.merged_group_ids.push(id);
				} else {
					acc.whatsapp_ids.push(id);
				}
				return acc;
			},
			{
				whatsapp_ids: [] as string[],
				merged_group_ids: [] as string[],
			}
		);

		const merged_groups = await MergedGroupDB.find({
			user: this.user,
			_id: { $in: merged_group_ids },
		});

		const whatsapp_extracted_ids = merged_groups.map((group) => group.groups).flat();
		return [...whatsapp_ids, ...whatsapp_extracted_ids];
	}

	async updateMessageModerationRule(
		id: Types.ObjectId,
		rule: {
			file_types: string[];
			admin_rule: ModeratorRule;
			creator_rule: ModeratorRule;
			group_rule: ModeratorRule;
		}
	) {
		const modified_result = await MergedGroupDB.updateOne(
			{ _id: id },
			{ $set: { moderation_rules: rule } }
		);
		if (modified_result.modifiedCount === 0) {
			return false;
		}
		return true;
	}

	private async findTriggeredGroups(group_id: string) {
		const groups = await MergedGroupDB.find({
			user: this.user,
			groups: group_id,
			active: true,
		}).populate('restricted_numbers');
		return groups;
	}

	private async isGroupTriggered({
		doc,
		chat,
		contact,
		message_body,
		isModerator = false,
	}: {
		doc: IMergedGroup;
		chat: WAWebJS.GroupChat;
		contact: WAWebJS.Contact;
		message_body: string;
		isModerator?: boolean;
	}) {
		const admin = chat.participants.find(
			(chatObj) => chatObj.id._serialized === contact.id._serialized
		);

		if (doc.reply_business_only && !contact.isBusiness) {
			return false;
		}
		if (!doc.canSendAdmin && admin && (admin.isAdmin || admin.isSuperAdmin)) {
			return false;
		}

		let cond = true;
		if (doc.triggers.length > 0 && !isModerator) {
			cond = false;
			for (const trigger of doc.triggers) {
				if (doc.options === BOT_TRIGGER_OPTIONS.EXACT_IGNORE_CASE) {
					cond = cond || message_body.toLowerCase() === trigger.toLowerCase();
				}
				if (doc.options === BOT_TRIGGER_OPTIONS.EXACT_MATCH_CASE) {
					cond = cond || message_body === trigger;
				}

				if (doc.options === BOT_TRIGGER_OPTIONS.INCLUDES_IGNORE_CASE) {
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
				if (doc.options === BOT_TRIGGER_OPTIONS.INCLUDES_MATCH_CASE) {
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

				if (doc.options === BOT_TRIGGER_OPTIONS.ANYWHERE_IGNORE_CASE) {
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
				if (doc.options === BOT_TRIGGER_OPTIONS.ANYWHERE_MATCH_CASE) {
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
		}

		if (!cond) {
			return false;
		}

		if (
			!DateUtils.isTimeBetween(
				DateUtils.getMoment(doc.start_time ?? '10:00', 'HH:mm'),
				DateUtils.getMoment(doc.end_time ?? '18:00', 'HH:mm'),
				DateUtils.getMomentNow()
			)
		) {
			return false;
		}

		const country_code = await WhatsappUtils.getCountryCode(contact);

		if (doc.allowed_country_codes.length > 0 && !doc.allowed_country_codes.includes(country_code)) {
			return false;
		}

		for (const restricted_numbers of doc.restricted_numbers) {
			const parsed_csv = await FileUtils.readCSV(restricted_numbers.filename);
			if (parsed_csv && parsed_csv.findIndex((el) => el.number === contact.id.user) !== -1) {
				return false;
			}
		}

		return true;
	}

	public async handleGroupMessage(
		whatsapp: WAWebJS.Client,
		{
			chat,
			message,
			contact,
			deviceService,
		}: {
			chat: WAWebJS.GroupChat;
			message: WAWebJS.Message;
			contact: WAWebJS.Contact;
			deviceService: DeviceService;
		}
	) {
		const group_id = chat.id._serialized;
		const user = this.user;

		const docs = await this.findTriggeredGroups(group_id);

		const { isSubscribed, isNew } = deviceService.isSubscribed();

		const { message_1: PROMOTIONAL_MESSAGE_1, message_2: PROMOTIONAL_MESSAGE_2 } =
			await TokenService.getPromotionalMessage();

		const createDocData = {
			user: this.user,
			from: contact.id._serialized,
			group_name: chat.name,
		};
		const message_body = message.hasMedia ? '' : message.body;

		const triggered_groups_without_moderator = (
			await Promise.all(
				docs.map(async (doc) => {
					const cond = await this.isGroupTriggered({ doc, chat, contact, message_body });
					return cond ? doc : null;
				})
			)
		).filter((doc) => doc !== null) as IMergedGroup[];

		triggered_groups_without_moderator.forEach(async (doc) => {
			const groupReply = contact.isMyContact ? doc.group_reply_saved : doc.group_reply_unsaved;
			const privateReply = contact.isMyContact
				? doc.private_reply_saved
				: doc.private_reply_unsaved;
			const adminPrivateReply = doc.private_reply_admin;

			sendGroupReply(doc, groupReply);
			sendPrivateReply(doc, privateReply);

			const { admins, creators } = chat.participants.reduce(
				(acc, curr) => {
					if (curr.isSuperAdmin) {
						acc.creators.push(curr.id._serialized);
					} else if (curr.isAdmin) {
						acc.admins.push(curr.id._serialized);
					}
					return acc;
				},
				{
					creators: [] as string[],
					admins: [] as string[],
				}
			);

			if (creators.length > 0) {
				creators.forEach((num) => {
					sendAdminPrivateReply(num, doc, adminPrivateReply);
				});
				for (let i = 0; i < admins.length && i < 1; i++) {
					sendAdminPrivateReply(admins[i], doc, adminPrivateReply);
				}
			} else if (admins.length > 0) {
				for (let i = 0; i < admins.length && i < 2; i++) {
					sendAdminPrivateReply(admins[i], doc, adminPrivateReply);
				}
			}

			const userPrefService = await UserPreferencesService.getService(this.user._id.toString());

			if (doc.forward.number) {
				const vCardString = new VCardBuilder({})
					.setFirstName(contact.name ?? contact.pushname)
					.setContactPhone(`+${contact.id.user}`, contact.id.user)
					.build();

				whatsapp
					.sendMessage(doc.forward.number + '@c.us', vCardString)
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

				if (doc.forward.message) {
					const _variable = '{{public_name}}';
					const custom_message = doc.forward.message.replace(
						new RegExp(_variable, 'g'),
						(contact.pushname || contact.name) ?? ''
					);
					whatsapp
						.sendMessage(doc.forward.number + '@c.us', custom_message)
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
		});

		const triggered_groups_with_moderator = (
			await Promise.all(
				docs.map(async (doc) => {
					const cond = await this.isGroupTriggered({
						doc,
						chat,
						contact,
						message_body,
						isModerator: true,
					});
					return cond ? doc : null;
				})
			)
		).filter((doc) => doc !== null) as IMergedGroup[];

		triggered_groups_with_moderator.forEach(async (doc) => {
			checkForMessageModeration(doc, message, chat);
		});

		async function sendGroupReply(
			doc: IMergedGroup,
			allReplies: {
				text: string;
				attachments?: IUpload[] | undefined;
				shared_contact_cards?: IContactCard[] | undefined;
				polls?: IPolls[] | undefined;
			}[]
		) {
			if (!doc) return;

			const userPrefService = await UserPreferencesService.getService(user._id.toString());

			try {
				await GroupReplyDB.create({
					...createDocData,
					mergedGroup: doc._id,
					unique_id: doc.multiple_responses ? message.id._serialized : 'only-once-key',
				});
			} catch (err) {
				return;
			}

			for (const reply of allReplies) {
				try {
					const { text, attachments, shared_contact_cards, polls } = reply;
					if (
						text.length === 0 &&
						attachments?.length === 0 &&
						shared_contact_cards?.length === 0 &&
						polls?.length === 0
					) {
						return;
					}
					await Delay(getRandomNumber(doc.min_delay, doc.max_delay));

					let _reply_text = text.replace(new RegExp('{{public_name}}', 'g'), contact.pushname);

					if (_reply_text.length > 0 && doc.random_string) {
						_reply_text += randomMessageText();
					}
					if (_reply_text.length > 0) {
						message.reply(_reply_text).then(async (_msg) => {
							if (userPrefService.getMessageStarRules().group_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
						});
					}

					shared_contact_cards?.forEach(async (id) => {
						const contact_service = new ContactCardService(user);
						const contact = await contact_service.getContact(id as unknown as Types.ObjectId);
						if (!contact) return;
						message.reply(contact.vCardString).then(async (_msg) => {
							if (userPrefService.getMessageStarRules().group_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
						});
					});

					attachments?.forEach(async (id) => {
						const attachment_service = new UploadService(user);
						const attachment = await attachment_service.getAttachment(
							id as unknown as Types.ObjectId
						);
						if (!attachment) return;
						const { filename, caption, name } = attachment;
						const path = __basedir + ATTACHMENTS_PATH + filename;
						if (!fs.existsSync(path)) {
							return null;
						}
						const media = MessageMedia.fromFilePath(path);
						if (name) {
							media.filename = name + path.substring(path.lastIndexOf('.'));
						}
						message.reply(media, undefined, { caption: caption }).then(async (_msg) => {
							if (userPrefService.getMessageStarRules().group_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
						});
					});

					polls?.forEach(async (poll) => {
						const { title, options, isMultiSelect } = poll;
						message
							.reply(
								new Poll(title, options, {
									messageSecret: randomVector(32),
									allowMultipleAnswers: isMultiSelect,
								})
							)
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().group_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
								await whatsapp.interface.openChatWindow(message.from);
							});
					});

					if (shared_contact_cards && shared_contact_cards.length > 0) {
						if (PROMOTIONAL_MESSAGE_2) {
							message.reply(PROMOTIONAL_MESSAGE_2);
						}
					} else if (!isSubscribed && isNew) {
						if (PROMOTIONAL_MESSAGE_1) {
							message.reply(PROMOTIONAL_MESSAGE_1);
						}
					}
				} catch (err) {}
			}
		}

		async function sendPrivateReply(
			doc: IMergedGroup,
			allReplies: {
				text: string;
				attachments?: IUpload[] | undefined;
				shared_contact_cards?: IContactCard[] | undefined;
				polls?: IPolls[] | undefined;
			}[]
		) {
			if (!doc) return;

			const userPrefService = await UserPreferencesService.getService(user._id.toString());
			try {
				await GroupPrivateReplyDB.create({
					...createDocData,
					mergedGroup: doc._id,
					unique_id: doc.multiple_responses ? message.id._serialized : 'only-once-key',
				});
			} catch (err) {
				return;
			}

			for (const reply of allReplies) {
				try {
					const { text, attachments, shared_contact_cards, polls } = reply;

					if (
						text.length === 0 &&
						attachments?.length === 0 &&
						shared_contact_cards?.length === 0 &&
						polls?.length === 0
					) {
						return;
					}
					await Delay(getRandomNumber(doc.min_delay, doc.max_delay));

					let _reply_text = text.replace(new RegExp('{{public_name}}', 'g'), contact.pushname);

					const to = contact.id._serialized;
					if (_reply_text.length > 0 && doc.random_string) {
						_reply_text += randomMessageText();
					}
					if (_reply_text.length > 0) {
						whatsapp
							.sendMessage(to, _reply_text, {
								quotedMessageId: message.id._serialized,
							})
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
							})
							.catch(() => {
								whatsapp
									.sendMessage(to, _reply_text)
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
					}
					shared_contact_cards?.forEach(async (id) => {
						const contact_service = new ContactCardService(user);
						const contact = await contact_service.getContact(id as unknown as Types.ObjectId);
						if (!contact) return;
						whatsapp
							.sendMessage(to, contact.vCardString, {
								quotedMessageId: message.id._serialized,
							})
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
							})
							.catch(() => {
								whatsapp
									.sendMessage(to, contact.vCardString)
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
					});

					attachments?.forEach(async (id) => {
						const attachment_service = new UploadService(user);
						const attachment = await attachment_service.getAttachment(
							id as unknown as Types.ObjectId
						);
						if (!attachment) return;
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
							.sendMessage(to, media, {
								caption: caption,
								quotedMessageId: message.id._serialized,
							})
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
							})
							.catch(() => {
								whatsapp
									.sendMessage(to, media, {
										caption: caption,
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
							});
					});

					polls?.forEach(async (poll) => {
						const { title, options, isMultiSelect } = poll;
						whatsapp
							.sendMessage(
								to,
								new Poll(title, options, {
									messageSecret: randomVector(32),
									allowMultipleAnswers: isMultiSelect,
								}),
								{
									quotedMessageId: message.id._serialized,
								}
							)
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
								await whatsapp.interface.openChatWindow(message.from);
							})
							.catch(() => {
								whatsapp
									.sendMessage(
										to,
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
										await whatsapp.interface.openChatWindow(message.from);
									})
									.catch((err) => {
										Logger.error('Error sending message:', err);
									});
							});
					});

					if (shared_contact_cards && shared_contact_cards.length > 0) {
						if (PROMOTIONAL_MESSAGE_2) {
							whatsapp
								.sendMessage(to, PROMOTIONAL_MESSAGE_2, {
									quotedMessageId: message.id._serialized,
								})
								.catch(() => {
									whatsapp.sendMessage(to, PROMOTIONAL_MESSAGE_2).catch((err) => {
										Logger.error('Error sending message:', err);
									});
								});
						}
					} else if (!isSubscribed && isNew) {
						if (PROMOTIONAL_MESSAGE_1) {
							whatsapp
								.sendMessage(to, PROMOTIONAL_MESSAGE_1, {
									quotedMessageId: message.id._serialized,
								})
								.catch(() => {
									whatsapp.sendMessage(to, PROMOTIONAL_MESSAGE_1).catch((err) => {
										Logger.error('Error sending message:', err);
									});
								});
						}
					}
				} catch (err) {}
			}
		}

		async function sendAdminPrivateReply(
			to: string,
			doc: IMergedGroup,
			allReplies: {
				text: string;
				attachments?: IUpload[] | undefined;
				shared_contact_cards?: IContactCard[] | undefined;
				polls?: IPolls[] | undefined;
			}[]
		) {
			if (!doc) return;

			const userPrefService = await UserPreferencesService.getService(user._id.toString());
			try {
				await GroupPrivateReplyDB.create({
					...createDocData,
					mergedGroup: doc._id,
					unique_id: doc.multiple_responses ? message.id._serialized : 'only-once-key',
				});
			} catch (err) {
				return;
			}
			for (const reply of allReplies) {
				try {
					const { text, attachments, shared_contact_cards, polls } = reply;

					if (
						text.length === 0 &&
						attachments?.length === 0 &&
						shared_contact_cards?.length === 0 &&
						polls?.length === 0
					) {
						return;
					}
					await Delay(getRandomNumber(doc.min_delay, doc.max_delay));
					let _reply_text = text;
					try {
						const recipient_contact = await whatsapp.getContactById(to);
						_reply_text = await WhatsappUtils.formatMessage(_reply_text, {
							'{{group_name}}': chat.name,
							'{{admin_name}}': recipient_contact.pushname,
							'{{sender_number}}': contact.number,
							'{{timestamp}}': DateUtils.getMomentNow().format('DD-MM-YYYY HH:mm:ss'),
						});
					} catch (err) {}

					if (_reply_text.length > 0 && doc.random_string) {
						_reply_text += randomMessageText();
					}
					if (_reply_text.length > 0) {
						whatsapp
							.sendMessage(to, _reply_text, {
								quotedMessageId: message.id._serialized,
							})
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
							})
							.catch(() => {
								whatsapp
									.sendMessage(to, _reply_text)
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
					}
					shared_contact_cards?.forEach(async (id) => {
						const contact_service = new ContactCardService(user);
						const contact = await contact_service.getContact(id as unknown as Types.ObjectId);
						if (!contact) return;
						whatsapp
							.sendMessage(to, contact.vCardString, {
								quotedMessageId: message.id._serialized,
							})
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
							})
							.catch(() => {
								whatsapp
									.sendMessage(to, contact.vCardString)
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
					});

					attachments?.forEach(async (id) => {
						const attachment_service = new UploadService(user);
						const attachment = await attachment_service.getAttachment(
							id as unknown as Types.ObjectId
						);
						if (!attachment) return;
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
							.sendMessage(to, media, {
								caption: caption,
								quotedMessageId: message.id._serialized,
							})
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
							})
							.catch(() => {
								whatsapp
									.sendMessage(to, media, {
										caption: caption,
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
							});
					});

					polls?.forEach(async (poll) => {
						const { title, options, isMultiSelect } = poll;
						whatsapp
							.sendMessage(
								to,
								new Poll(title, options, {
									messageSecret: randomVector(32),
									allowMultipleAnswers: isMultiSelect,
								}),
								{
									quotedMessageId: message.id._serialized,
								}
							)
							.then(async (_msg) => {
								if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
									setTimeout(() => {
										_msg.star();
									}, 1000);
								}
								await whatsapp.interface.openChatWindow(message.from);
							})
							.catch(() => {
								whatsapp
									.sendMessage(
										to,
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
										await whatsapp.interface.openChatWindow(message.from);
									})
									.catch((err) => {
										Logger.error('Error sending message:', err);
									});
							});
					});

					if (shared_contact_cards && shared_contact_cards.length > 0) {
						if (PROMOTIONAL_MESSAGE_2) {
							whatsapp
								.sendMessage(to, PROMOTIONAL_MESSAGE_2, {
									quotedMessageId: message.id._serialized,
								})
								.catch(() => {
									whatsapp.sendMessage(to, PROMOTIONAL_MESSAGE_2).catch((err) => {
										Logger.error('Error sending message:', err);
									});
								});
						}
					} else if (!isSubscribed && isNew) {
						if (PROMOTIONAL_MESSAGE_1) {
							whatsapp
								.sendMessage(to, PROMOTIONAL_MESSAGE_1, {
									quotedMessageId: message.id._serialized,
								})
								.catch(() => {
									whatsapp.sendMessage(to, PROMOTIONAL_MESSAGE_1).catch((err) => {
										Logger.error('Error sending message:', err);
									});
								});
						}
					}
				} catch (err) {}
			}
		}

		async function checkForMessageModeration(
			doc: IMergedGroup,
			message: WAWebJS.Message,
			group_chat: WAWebJS.GroupChat
		) {
			if (!doc.moderation_rules) return;
			const userPreferences = await UserPreferencesService.getService(user._id.toString());

			async function sendMessage(
				recipient: string,
				rule: {
					message: string;
					shared_contact_cards: Types.ObjectId[];
					attachments: Types.ObjectId[];
					polls: { title: string; options: string[]; isMultiSelect: boolean }[];
				}
			) {
				//group_name,admin_name,sender_number,timestamp
				let msg = rule.message;
				if (msg) {
					try {
						const recipient_contact = await whatsapp.getContactById(recipient);
						msg = await WhatsappUtils.formatMessage(msg, {
							'{{group_name}}': chat.name,
							'{{admin_name}}': recipient_contact.pushname,
							'{{sender_number}}': contact.number,
							'{{timestamp}}': DateUtils.getMomentNow().format('DD-MM-YYYY HH:mm:ss'),
						});
					} catch (err) {}

					whatsapp
						.sendMessage(recipient, msg, {
							quotedMessageId: message.id._serialized,
						})
						.then(async (_msg) => {
							if (userPreferences.getMessageStarRules().individual_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
						})
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				}

				for (const attachment_id of rule.attachments) {
					const mediaObject = await new UploadService(user).getAttachment(attachment_id);
					const path = __basedir + ATTACHMENTS_PATH + mediaObject.filename;
					if (!fs.existsSync(path)) {
						continue;
					}
					const media = MessageMedia.fromFilePath(path);
					if (mediaObject.name) {
						media.filename = mediaObject.name + path.substring(path.lastIndexOf('.'));
					}
					whatsapp
						.sendMessage(recipient, media, {
							caption: mediaObject.caption,
							quotedMessageId: message.id._serialized,
						})
						.then(async (_msg) => {
							if (userPreferences.getMessageStarRules().individual_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
						})
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				}

				(rule.shared_contact_cards ?? []).forEach(async (card_id) => {
					const card = await new ContactCardService(user).getContact(card_id)!;
					whatsapp
						.sendMessage(recipient, card.vCardString, {
							quotedMessageId: message.id._serialized,
						})
						.then(async (_msg) => {
							if (userPreferences.getMessageStarRules().individual_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
						})
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				});

				(rule.polls ?? []).forEach(async (poll) => {
					const { title, options, isMultiSelect } = poll;
					whatsapp
						.sendMessage(
							recipient,
							new Poll(title, options, {
								messageSecret: randomVector(32),
								allowMultipleAnswers: isMultiSelect,
							}),
							{
								quotedMessageId: message.id._serialized,
							}
						)
						.then(async (_msg) => {
							if (userPreferences.getMessageStarRules().individual_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
							await whatsapp.interface.openChatWindow(recipient);
						})
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				});
			}

			const { admins, creators } = group_chat.participants.reduce(
				(acc, curr) => {
					if (curr.isSuperAdmin) {
						acc.creators.push(curr.id._serialized);
					} else if (curr.isAdmin) {
						acc.admins.push(curr.id._serialized);
					}
					return acc;
				},
				{
					creators: [] as string[],
					admins: [] as string[],
				}
			);

			const { admin_rule, creator_rule, group_rule, file_types } = doc.moderation_rules;

			let media;

			try {
				media = await message?.downloadMedia();
			} catch (err) {}

			let isRestricted = false;

			if (media) {
				if (
					file_types.includes('all') ||
					(file_types.includes('image') && media.mimetype.includes('image')) ||
					(file_types.includes('video') && media.mimetype.includes('video')) ||
					file_types.includes(media.mimetype) ||
					(file_types.includes('') && !mimeTypes.includes(media.mimetype))
				) {
					isRestricted = true;
				} else {
					isRestricted = false;
				}
			} else {
				if (file_types.includes('all') || file_types.includes('text')) {
					isRestricted = true;
				} else {
					isRestricted = false;
				}
			}

			if (!isRestricted) {
				return;
			}

			if (group_rule) {
				sendMessage(group_id, group_rule);
			}
			if (creator_rule && creators.length > 0) {
				creators.forEach((num) => {
					sendMessage(num, creator_rule);
				});
				for (let i = 0; i < admins.length && i < 1; i++) {
					sendMessage(admins[i], admin_rule);
				}
			} else if (admin_rule && admins.length > 0) {
				for (let i = 0; i < admins.length && i < 2; i++) {
					sendMessage(admins[i], admin_rule);
				}
			}
		}
	}
}
