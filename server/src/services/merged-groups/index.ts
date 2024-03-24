import fs from 'fs';
import { Types } from 'mongoose';
import WAWebJS, { MessageMedia, Poll } from 'whatsapp-web.js';
import { ATTACHMENTS_PATH } from '../../config/const';
import { GroupPrivateReplyDB, GroupReplyDB } from '../../repository/group-reply';
import MergedGroupDB from '../../repository/merged-groups';
import IMergedGroup from '../../types/merged-group';
import IPolls from '../../types/polls';
import { IUser } from '../../types/user';
import { Delay, getRandomNumber, idValidator, randomMessageText } from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';
import ContactCardService from '../contact-card';
import TokenService from '../token';
import UploadService from '../uploads';
import UserService from '../user';

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
			};
			group_reply_unsaved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			};
			private_reply_saved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			};
			private_reply_unsaved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			};
			restricted_numbers?: Types.ObjectId[];
			reply_business_only: boolean;
			random_string: boolean;
			min_delay: number;
			max_delay: number;
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
			};
			group_reply_unsaved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			};
			private_reply_saved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			};
			private_reply_unsaved: {
				text: string;
				shared_contact_cards: Types.ObjectId[];
				attachments: Types.ObjectId[];
				polls: IPolls[];
			};
			restricted_numbers?: Types.ObjectId[];
			reply_business_only?: boolean;
			random_string?: boolean;
			min_delay: number;
			max_delay: number;
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
			})),
			...group_replies.map((doc) => ({
				recipient: doc.from.split('@')[0],
				group_name: doc.group_name,
				reply_type: 'In Chat Reply',
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
		}: {
			chat: WAWebJS.GroupChat;
			message: WAWebJS.Message;
			contact: WAWebJS.Contact;
		}
	) {
		const group_id = chat.id._serialized;

		const doc = await MergedGroupDB.findOne({
			user: this.user,
			groups: group_id,
			active: true,
		}).populate('restricted_numbers');

		if (!doc) {
			return;
		}

		const admin = chat.participants.find((chatObj) => chatObj.id._serialized === message.from);
		if (admin && (admin.isAdmin || admin.isSuperAdmin)) {
			return;
		}
		if (doc.reply_business_only && !contact.isBusiness) {
			return;
		}
		for (const restricted_numbers of doc.restricted_numbers) {
			const parsed_csv = await FileUtils.readCSV(restricted_numbers.filename);
			if (parsed_csv && parsed_csv.findIndex((el) => el.number === contact.id.user) !== -1) {
				return;
			}
		}

		const { message_1: PROMOTIONAL_MESSAGE_1, message_2: PROMOTIONAL_MESSAGE_2 } =
			await TokenService.getPromotionalMessage();
		const { isSubscribed, isNew } = new UserService(this.user).isSubscribed();

		const groupReply = contact.isMyContact ? doc.group_reply_saved : doc.group_reply_unsaved;
		const privateReply = contact.isMyContact ? doc.private_reply_saved : doc.private_reply_unsaved;

		const user = this.user;
		const createDocData = {
			user: user,
			from: contact.id._serialized,
			mergedGroup: doc,
			group_name: chat.name,
		};

		async function sendGroupReply() {
			if (!doc) return;
			try {
				const { text, attachments, shared_contact_cards, polls } = groupReply;
				if (
					text.length === 0 &&
					attachments?.length === 0 &&
					shared_contact_cards?.length === 0 &&
					polls?.length === 0
				) {
					return;
				}
				await Delay(getRandomNumber(doc.min_delay, doc.max_delay));

				await GroupReplyDB.create(createDocData);
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
					message.reply(PROMOTIONAL_MESSAGE_2);
				} else if (!isSubscribed && isNew) {
					message.reply(PROMOTIONAL_MESSAGE_1);
				}
			} catch (err) {}
		}

		async function sendPrivateReply() {
			if (!doc) return;
			try {
				const { text, attachments, shared_contact_cards, polls } = privateReply;
				if (
					text.length === 0 &&
					attachments?.length === 0 &&
					shared_contact_cards?.length === 0 &&
					polls?.length === 0
				) {
					return;
				}
				await Delay(getRandomNumber(doc.min_delay, doc.max_delay));

				await GroupPrivateReplyDB.create(createDocData);
				let _reply_text = text.replace(new RegExp('{{public_name}}', 'g'), contact.pushname);

				const to = contact.id._serialized;
				if (_reply_text.length > 0 && doc.random_string) {
					_reply_text += randomMessageText();
				}
				if (_reply_text.length > 0) {
					whatsapp.sendMessage(to, _reply_text, {
						quotedMessageId: message.id._serialized,
					});
				}
				shared_contact_cards?.forEach(async (id) => {
					const contact_service = new ContactCardService(user);
					const contact = await contact_service.getContact(id as unknown as Types.ObjectId);
					if (!contact) return;
					whatsapp.sendMessage(to, contact.vCardString, {
						quotedMessageId: message.id._serialized,
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
					whatsapp.sendMessage(to, media, {
						caption: caption,
						quotedMessageId: message.id._serialized,
					});
				});

				polls?.forEach(async (poll) => {
					const { title, options, isMultiSelect } = poll;
					whatsapp.sendMessage(
						to,
						new Poll(title, options, { allowMultipleAnswers: isMultiSelect }),
						{
							quotedMessageId: message.id._serialized,
						}
					);
				});

				if (shared_contact_cards && shared_contact_cards.length > 0) {
					whatsapp.sendMessage(to, PROMOTIONAL_MESSAGE_2, {
						quotedMessageId: message.id._serialized,
					});
				} else if (!isSubscribed && isNew) {
					whatsapp.sendMessage(to, PROMOTIONAL_MESSAGE_1, {
						quotedMessageId: message.id._serialized,
					});
				}
			} catch (err) {}
		}

		sendGroupReply();
		sendPrivateReply();
	}
}
