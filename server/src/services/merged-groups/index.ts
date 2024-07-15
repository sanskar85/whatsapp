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
import { Delay, getRandomNumber, idValidator, randomMessageText } from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';
import ContactCardService from '../contact-card';
import TokenService from '../token';
import UploadService from '../uploads';
import { DeviceService } from '../user';

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
	};
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
			restricted_numbers?: Types.ObjectId[];
			reply_business_only: boolean;
			random_string: boolean;
			min_delay: number;
			max_delay: number;
			canSendAdmin: boolean;
			multiple_responses: boolean;
			triggers: string[];
			options: BOT_TRIGGER_OPTIONS;
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
			restricted_numbers?: Types.ObjectId[];
			reply_business_only?: boolean;
			random_string?: boolean;
			min_delay: number;
			max_delay: number;
			canSendAdmin: boolean;
			multiple_responses: boolean;
			triggers: string[];
			options: BOT_TRIGGER_OPTIONS;
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

	public async sendGroupReply(
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

		const docs = await MergedGroupDB.find({
			user: this.user,
			groups: group_id,
			active: true,
		}).populate('restricted_numbers');

		const { isSubscribed, isNew } = deviceService.isSubscribed();

		const { message_1: PROMOTIONAL_MESSAGE_1, message_2: PROMOTIONAL_MESSAGE_2 } =
			await TokenService.getPromotionalMessage();

		const createDocData = {
			user: this.user,
			from: contact.id._serialized,
			group_name: chat.name,
		};
		const admin = chat.participants.find(
			(chatObj) => chatObj.id._serialized === contact.id._serialized
		);
		const message_body = message.body;

		docs.forEach(async (doc) => {
			if (doc.reply_business_only && !contact.isBusiness) {
				return;
			}
			if (!doc.canSendAdmin && admin && (admin.isAdmin || admin.isSuperAdmin)) {
				return;
			}

			let cond = true;
			if (doc.triggers.length > 0) {
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
				}
			}

			if (!cond) {
				return;
			}

			for (const restricted_numbers of doc.restricted_numbers) {
				const parsed_csv = await FileUtils.readCSV(restricted_numbers.filename);
				if (parsed_csv && parsed_csv.findIndex((el) => el.number === contact.id.user) !== -1) {
					return;
				}
			}

			const groupReply = contact.isMyContact ? doc.group_reply_saved : doc.group_reply_unsaved;
			const privateReply = contact.isMyContact
				? doc.private_reply_saved
				: doc.private_reply_unsaved;

			sendGroupReply(doc, groupReply);
			sendPrivateReply(doc, privateReply);
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
			if (!doc.multiple_responses) {
				try {
					await GroupReplyDB.create({ ...createDocData, mergedGroup: doc._id });
				} catch (err) {
					return;
				}
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
						message.reply(_reply_text);
					}

					shared_contact_cards?.forEach(async (id) => {
						const contact_service = new ContactCardService(user);
						const contact = await contact_service.getContact(id as unknown as Types.ObjectId);
						if (!contact) return;
						message.reply(contact.vCardString);
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
						message.reply(media, undefined, { caption: caption });
					});

					polls?.forEach(async (poll) => {
						const { title, options, isMultiSelect } = poll;
						message.reply(new Poll(title, options, { allowMultipleAnswers: isMultiSelect }));
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
			if (!doc.multiple_responses) {
				try {
					await GroupPrivateReplyDB.create({ ...createDocData, mergedGroup: doc._id });
				} catch (err) {
					return;
				}
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
							.catch(() => {
								whatsapp.sendMessage(to, _reply_text).catch((err) => {
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
							.catch(() => {
								whatsapp.sendMessage(to, contact.vCardString).catch((err) => {
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
							.catch(() => {
								whatsapp
									.sendMessage(to, media, {
										caption: caption,
									})
									.catch((err) => {
										Logger.error('Error sending message:', err);
									});
							});
					});

					polls?.forEach(async (poll) => {
						const { title, options, isMultiSelect } = poll;
						whatsapp
							.sendMessage(to, new Poll(title, options, { allowMultipleAnswers: isMultiSelect }), {
								quotedMessageId: message.id._serialized,
							})
							.catch(() => {
								whatsapp
									.sendMessage(
										to,
										new Poll(title, options, { allowMultipleAnswers: isMultiSelect })
									)
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
	}
}
