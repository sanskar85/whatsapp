import fs from 'fs';
import moment from 'moment';
import { Types } from 'mongoose';
import Logger from 'n23-logger';
import WAWebJS, { GroupChat, MessageMedia, Poll } from 'whatsapp-web.js';
import { ATTACHMENTS_PATH } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { DeviceDB } from '../../repository/user';
import { IDevice, IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import { randomVector } from '../../utils/ExpressUtils';
import BotService from '../bot';
import ContactCardService from '../contact-card';
import { mimeTypes } from '../message-logger';
import { PaymentService } from '../payments';
import UploadService from '../uploads';
import UserService from './user';
import UserPreferencesService from './userPreferences';

export default class DeviceService extends UserService {
	private device: IDevice;

	public constructor(device: IDevice, user: IUser) {
		super(user);
		this.device = device;
	}

	static async getDeviceService(phone: string | Types.ObjectId) {
		let device: IDevice | null = null;

		if (typeof phone === 'string') {
			device = await DeviceDB.findOne({ phone });
		} else {
			device = await DeviceDB.findById(phone);
		}
		if (device === null) {
			throw new InternalError(INTERNAL_ERRORS.USER_ERRORS.NOT_FOUND);
		}
		const user = await UserService.getService(new Types.ObjectId(device.user));
		return new DeviceService(device, user.getUser());
	}

	static async getServiceByClientID(client_id: string) {
		const device = await DeviceDB.findOne({ client_id });
		if (device === null) {
			throw new InternalError(INTERNAL_ERRORS.USER_ERRORS.NOT_FOUND);
		}

		const user = await UserService.getService(device.user);
		return new DeviceService(device, user.getUser());
	}

	getUserId() {
		return new Types.ObjectId(this.device._id);
	}

	getName() {
		return this.device.name;
	}

	getPhoneNumber() {
		return this.device.phone;
	}

	getUserType() {
		return this.device.userType;
	}

	async setClientID(client_id: string) {
		await DeviceDB.updateOne({ _id: this.device._id }, { client_id });
	}

	async logout() {
		DeviceService.logout(this.device.client_id);
	}

	isSubscribed() {
		const isPaymentValid = this.device.subscription_expiry
			? DateUtils.getMoment(this.device.subscription_expiry).isAfter(DateUtils.getMomentNow())
			: false;

		const isNew = DateUtils.getMoment(this.getUser().createdAt)
			.add(7, 'days')
			.isAfter(DateUtils.getMomentNow());

		return {
			isSubscribed: isPaymentValid,
			isNew: isNew,
		};
	}

	getExpiration<T extends string | null>(
		format: T = null as T
	): T extends string ? string : moment.Moment {
		if (format) {
			return DateUtils.getMoment(this.device.subscription_expiry).format(format) as T extends string
				? string
				: moment.Moment;
		}
		return DateUtils.getMoment(this.device.subscription_expiry) as T extends string
			? string
			: moment.Moment;
	}

	async addMonthToExpiry(months: number = 1) {
		if (this.device.subscription_expiry) {
			if (DateUtils.getMoment(this.device.subscription_expiry).isAfter(DateUtils.getMomentNow())) {
				this.device.subscription_expiry = DateUtils.getMoment(this.device.subscription_expiry)
					.add(months, 'months')
					.toDate();
			} else {
				this.device.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
			}
		} else {
			this.device.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
		}

		await this.device.save();
	}
	async setExpiry(date: moment.Moment) {
		if (this.device.subscription_expiry) {
			if (DateUtils.getMoment(this.device.subscription_expiry).isBefore(date)) {
				this.device.subscription_expiry = date.toDate();
				await this.device.save();
			}
		} else {
			this.device.subscription_expiry = date.toDate();
			await this.device.save();
		}
	}

	getPaymentRecords() {
		return PaymentService.getPaymentRecords(this.device.phone);
	}

	pauseSubscription(id: Types.ObjectId) {
		return PaymentService.pauseSubscription(id, this.device.phone);
	}

	resumeSubscription(id: Types.ObjectId) {
		return PaymentService.resumeSubscription(id, this.device.phone);
	}

	static async createDevice({
		user,
		name,
		phone,
		isBusiness,
		business_details,
	}: {
		user: UserService;
		name?: string;
		phone: string;
		isBusiness?: boolean;
		business_details?: {
			description: string;
			email: string;
			websites: string[];
			latitude: number;
			longitude: number;
			address: string;
		};
	}) {
		const device = await DeviceDB.findOne({ user: user.getUserId(), phone });

		if (device) {
			device.userType = isBusiness ? 'BUSINESS' : 'PERSONAL';
			device.name = name ?? '';
			device.business_details = business_details ?? {
				description: '',
				email: '',
				websites: [] as string[],
				latitude: 0,
				longitude: 0,
				address: '',
			};
			await device.save();
			return new DeviceService(device, user.getUser());
		}

		const created_device = await DeviceDB.create({
			user: user.getUserId(),
			name,
			phone,
			userType: isBusiness ? 'BUSINESS' : 'PERSONAL',
			business_details: business_details ?? {
				description: '',
				email: '',
				websites: [] as string[],
				latitude: 0,
				longitude: 0,
				address: '',
			},
		});
		return new DeviceService(created_device, user.getUser());
	}
	static async addMonthToExpiry(phone: string, months: number = 1) {
		let device = await DeviceDB.findOne({ phone });

		if (!device) {
			device = await DeviceDB.create({
				phone,
			});
		}

		if (device.subscription_expiry) {
			if (DateUtils.getMoment(device.subscription_expiry).isAfter(DateUtils.getMomentNow())) {
				device.subscription_expiry = DateUtils.getMoment(device.subscription_expiry)
					.add(months, 'months')
					.toDate();
			} else {
				device.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
			}
		} else {
			device.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
		}
	}

	static async logoutUser(user_id: Types.ObjectId) {
		try {
			const devices = await DeviceDB.find({
				user: user_id,
			});

			await DeviceDB.updateOne(
				{
					user: user_id,
				},
				{
					client_id: '',
				}
			);

			devices.forEach((device) => {
				if (!device.client_id) return;
				const whatsapp = WhatsappProvider.clientByClientID(device.client_id);
				if (!whatsapp) return;
				whatsapp.logoutClient().catch((error: unknown) => {
					Logger.error('Error logging out client', error as Error, {
						user_id,
						client_id: device.client_id,
					});
				});
			});
		} catch (e) {
			//ignored
		}
	}

	static async logout(client_id: string) {
		try {
			await DeviceDB.updateOne(
				{
					client_id,
				},
				{
					client_id: '',
				}
			);
		} catch (e) {
			//ignored
		}
	}

	static async isValidDevice(client_id: string): Promise<
		| {
				valid: false;
				revoke_at: undefined;
				user: undefined;
		  }
		| {
				valid: true;
				revoke_at: Date;
				user: IUser;
		  }
	> {
		const auth = await DeviceDB.findOne({
			client_id,
		}).populate<{ user: IUser }>('user');

		if (!auth) {
			return {
				valid: false,
				revoke_at: undefined,
				user: undefined,
			};
		}

		const isPaymentValid = !auth.subscription_expiry
			? DateUtils.getMoment(auth.subscription_expiry).isAfter(DateUtils.getMomentNow())
			: false;

		if (isPaymentValid) {
			return {
				valid: true,
				revoke_at: auth.subscription_expiry,
				user: auth.user,
			};
		}

		return {
			valid: true,
			revoke_at: auth.revoke_at,
			user: auth.user,
		};
	}

	public async handleMessage({
		triggered_from,
		body,
		contact,
		client_id,
		chat,
		isGroup = false,
		fromPoll = false,
		message_id = '',
		message,
	}: {
		triggered_from: string;
		body: string;
		contact: WAWebJS.Contact;
		isGroup: boolean;
		fromPoll: boolean;
		message_id: string;
		client_id: string;
		chat: WAWebJS.Chat;
		message?: WAWebJS.Message;
	}) {
		const { isSubscribed, isNew } = this.isSubscribed();
		if (!isSubscribed && !isNew) {
			return;
		}

		const botService = new BotService(this.getUser());
		const userPreferences = await UserPreferencesService.getService(this.getUserId());
		botService.handleMessage(triggered_from, body, contact, {
			isGroup,
			fromPoll,
			message_id,
			isNew,
			isSubscribed,
			client_id,
			device_id: this.device._id,
		});

		if (isGroup && Object.keys(userPreferences.getMessageModerationRules()).length > 0) {
			const user = this.getUser();
			const whatsapp = WhatsappProvider.clientByClientID(client_id)!;
			if (!whatsapp) {
				return;
			}
			const groupChat = chat as GroupChat;
			const moderationRules = userPreferences.getMessageModerationRules();

			Object.values(moderationRules).forEach(async (rule) => {
				if (!rule.groups || !rule.groups.includes(chat.id._serialized)) {
					return;
				}

				let media;

				try {
					media = await message?.downloadMedia();
				} catch (err) {}

				let isRestricted = false;

				if (media) {
					if (
						rule.file_types.includes('all') ||
						(rule.file_types.includes('image') && media.mimetype.includes('image')) ||
						(rule.file_types.includes('video') && media.mimetype.includes('video')) ||
						rule.file_types.includes(media.mimetype) ||
						(rule.file_types.includes('') && !mimeTypes.includes(media.mimetype))
					) {
						isRestricted = true;
					} else {
						isRestricted = false;
					}
				} else {
					if (rule.file_types.includes('all') || rule.file_types.includes('text')) {
						isRestricted = true;
					} else {
						isRestricted = false;
					}
				}

				if (!isRestricted || !rule.admin_rule || !rule.creator_rule) {
					return;
				}

				const { admins, creators } = groupChat.participants.reduce(
					(acc, curr) => {
						if (curr.isSuperAdmin) {
							acc.creators.push(curr.id._serialized);
						} else if (curr.id) {
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
						sendMessage(num, rule.admin_rule);
					});
					for (let i = 0; i < admins.length || i < 1; i++) {
						sendMessage(admins[i], rule.creator_rule);
					}
				} else {
					for (let i = 0; i < admins.length || i < 2; i++) {
						sendMessage(admins[i], rule.creator_rule);
					}
				}
			});

			async function sendMessage(
				recipient: string,
				rule: {
					message: string;
					shared_contact_cards: Types.ObjectId[];
					attachments: Types.ObjectId[];
					polls: { title: string; options: string[]; isMultiSelect: boolean }[];
				}
			) {
				async function formatMessage(text: string) {
					const recipient_contact = await whatsapp.getClient().getContactById(recipient);
					if (text.includes('{{group_name}}')) {
						text = text.replace('{{group_name}}', chat.name);
					}
					if (text.includes('{{admin_name}}')) {
						text = text.replace('{{admin_name}}', recipient_contact.pushname);
					}
					if (text.includes('{{sender_number}}')) {
						text = text.replace('{{sender_number}}', contact.number);
					}
					if (text.includes('{{timestamp}}')) {
						text = text.replace(
							'{{timestamp}}',
							DateUtils.getMomentNow().format('DD-MM-YYYY HH:mm:ss')
						);
					}
					return text;
				}

				//group_name,admin_name,sender_number,timestamp
				let msg = rule.message;
				if (msg) {
					try {
						msg = await formatMessage(msg);
					} catch (err) {}

					whatsapp
						.getClient()
						.sendMessage(recipient, msg)
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
						.getClient()
						.sendMessage(recipient, media, {
							caption: mediaObject.caption,
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
						.getClient()
						.sendMessage(recipient, card.vCardString)
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
						.getClient()
						.sendMessage(
							recipient,
							new Poll(title, options, {
								messageSecret: randomVector(32),
								allowMultipleAnswers: isMultiSelect,
							})
						)
						.then(async (_msg) => {
							if (userPreferences.getMessageStarRules().individual_outgoing_messages) {
								setTimeout(() => {
									_msg.star();
								}, 1000);
							}
							await whatsapp.getClient().interface.openChatWindow(recipient);
						})
						.catch((err) => {
							Logger.error('Error sending message:', err);
						});
				});
			}
		}
	}
}
