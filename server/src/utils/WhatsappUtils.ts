import fs from 'fs';
import Logger from 'n23-logger';
import WAWebJS, { BusinessContact, Contact, ContactId, GroupChat } from 'whatsapp-web.js';
import { COUNTRIES, IS_PRODUCTION, SESSION_STARTUP_WAIT_TIME, TASK_STATUS } from '../config/const';
import InternalError, { INTERNAL_ERRORS } from '../errors/internal-errors';
import { WhatsappProvider } from '../provider/whatsapp_provider';
import TaskDB from '../repository/tasks';
import { UserService } from '../services';
import { DeviceService } from '../services/user';
import {
	GroupDetails,
	TBusinessContact,
	TContact,
	TGroupBusinessContact,
	TGroupContact,
	TLabelBusinessContact,
	TLabelContact,
} from '../types/whatsapp';

export type MappedContacts = {
	[contact_number: string]: {
		name: string;
		public_name: string;
		number: string;
		isBusiness: 'Business' | 'Personal';
		country: string;
		description: string;
		email: string;
		websites: string[];
		latitude: number;
		longitude: number;
		address: string;
		isSaved: boolean;
		isEnterprise: boolean;
	};
};

export default class WhatsappUtils {
	private whatsapp: WhatsappProvider;
	constructor(whatsapp: WhatsappProvider) {
		this.whatsapp = whatsapp;
	}

	async getNumberIds(numbers: string[]) {
		const numbersPromise = numbers.map(async (number) => {
			try {
				const numberID = await this.whatsapp.getClient().getNumberId(number);
				if (!numberID) {
					return null;
				}
				return numberID._serialized;
			} catch (err) {
				return null;
			}
		});

		return (await Promise.all(numbersPromise)).filter((number) => number !== null) as string[];
	}
	async getNumberWithId(number: string) {
		try {
			const numberID = await this.whatsapp.getClient().getNumberId(number);
			if (!numberID) {
				throw new Error('Invalid number');
			}
			return {
				number,
				numberId: numberID._serialized,
			};
		} catch (err) {
			return null;
		}
	}

	async getChat(id: string) {
		try {
			const chat = await this.whatsapp.getClient().getChatById(id);
			if (!chat) return null;
			return chat;
		} catch (err) {
			return null;
		}
	}

	async getChatIds(ids: string | string[]) {
		const searchable_ids = typeof ids === 'string' ? [ids] : ids;
		return (
			await Promise.all(
				searchable_ids.map(async (id) => {
					const chat = await this.getChat(id);
					return chat ? chat.id._serialized : null;
				})
			)
		).filter((chat) => chat) as string[];
	}

	async getParticipantsChatByGroup(group_id: string) {
		const chat = await this.getChat(group_id);
		if (!chat || !chat.isGroup) {
			throw new InternalError(INTERNAL_ERRORS.WHATSAPP_ERROR.INVALID_GROUP_ID);
		}

		return (chat as GroupChat).participants.map((participant) => participant.id._serialized);
	}

	async getChatIdsByLabel(label_id: string) {
		if (!this.whatsapp.isBusiness()) {
			throw new InternalError(INTERNAL_ERRORS.WHATSAPP_ERROR.BUSINESS_ACCOUNT_REQUIRED);
		}
		try {
			const chats = await this.whatsapp.getClient().getChatsByLabelId(label_id);

			return chats.map((chat) => chat.id._serialized);
		} catch (err) {
			return [];
		}
	}

	async getContacts() {
		const saved_contacts = (await this.whatsapp.getClient().getContacts()).filter(
			(contact) =>
				!contact.id._serialized.endsWith('@lid') &&
				contact.isMyContact &&
				!contact.isGroup &&
				!contact.isMe
		);
		const chats = await this.whatsapp.getClient().getChats();

		const { non_saved_contacts, chat_contacts, groups } = await chats.reduce(
			async (accP, chat) => {
				const acc = await accP;
				if (chat.isGroup) {
					acc.groups.push({
						id: (chat as GroupChat).id._serialized,
						name: (chat as GroupChat).name ?? '',
						isMergedGroup: false,
						participants: (chat as GroupChat).participants.length,
					} as GroupDetails);
					return acc;
				}
				try {
					const contact = await this.whatsapp.getClient().getContactById(chat.id._serialized);
					if (!contact.isMyContact && !contact.isMe) {
						acc.non_saved_contacts.push(contact);
					}
					if (contact.isMyContact && !contact.isMe) {
						acc.chat_contacts.push(contact);
					}
				} catch (err) {}
				return acc;
			},
			Promise.resolve({
				non_saved_contacts: [] as WAWebJS.Contact[],
				chat_contacts: [] as WAWebJS.Contact[],
				groups: [] as GroupDetails[],
			})
		);

		return {
			saved: saved_contacts,
			non_saved: non_saved_contacts,
			chat_contacts: chat_contacts,
			groups: groups.filter((group) => !!group.name),
		};
	}

	async getContactDetails(contact: WAWebJS.Contact) {
		let country_code = '',
			country = '';
		try {
			if (Object.hasOwnProperty('getCountryCode')) {
				country_code = await contact.getCountryCode();
			} else if (Object.hasOwnProperty('number')) {
				country_code = await this.whatsapp.getClient().getCountryCode(contact.number);
			}
			country = COUNTRIES[country_code as string];
		} catch (err) {}

		return {
			name: contact.name ?? '',
			number: contact.number,
			isBusiness: (contact.isBusiness ? 'Business' : 'Personal') as 'Business' | 'Personal',
			country,
			public_name: contact.pushname ?? '',
			isSaved: contact.isMyContact,
			isEnterprise: contact.isEnterprise,
		};
	}
	static getBusinessDetails(contact: Contact) {
		const business_contact = contact as BusinessContact;
		const business_details = business_contact.businessProfile as unknown as {
			description: string;
			email: string;
			website: { url: string }[];
			latitude: number;
			longitude: number;
			address: string;
		};
		const websites: string[] = [];
		try {
			business_details.website.forEach((website) => {
				websites.push(website.url);
			});
		} catch (err) {}

		return {
			description: business_details?.description ?? '',
			email: business_details?.email ?? '',
			websites,
			latitude: business_details?.latitude ?? 0,
			longitude: business_details?.longitude ?? 0,
			address: business_details?.address ?? '',
		};
	}

	async contactsWithCountry(contacts: WAWebJS.Contact[]) {
		const detailed_contacts = await Promise.all(
			contacts.map(async (contact) => {
				const contact_details = (await this.getContactDetails(contact)) as TContact;
				if (!contact.isBusiness) {
					return contact_details;
				}
				const business_details = WhatsappUtils.getBusinessDetails(contact as BusinessContact);

				return {
					...contact_details,
					...business_details,
				} as TBusinessContact;
			})
		);

		const valid_contacts = detailed_contacts.filter((contact) => contact !== null);

		return valid_contacts as (TBusinessContact | TContact)[];
	}

	async getGroupContacts<T extends boolean>(
		groupChat: GroupChat,
		options: {
			saved: boolean;
			unsaved: boolean;
			business_details?: boolean;
			mapped_contacts: MappedContacts;
		}
	): Promise<T extends true ? TGroupBusinessContact[] : TGroupContact[]> {
		const contacts = options.mapped_contacts;

		const group_participants = await Promise.all(
			groupChat.participants.map(async (participant) => {
				const contact = contacts[participant.id.user] ?? null;

				const contact_details: TGroupContact & {
					isSaved: boolean;
				} = {
					group_id: groupChat.id._serialized.split('@')[0],
					name: contact ? contact.name : '',
					number: participant.id.user,
					country: contact ? contact.country : '',
					isBusiness: contact ? contact.isBusiness : 'Personal',
					public_name: contact ? contact.public_name : '',
					group_name: groupChat.name,
					user_type: participant.isSuperAdmin ? 'CREATOR' : participant.isAdmin ? 'ADMIN' : 'USER',
					isSaved: contact ? contact.isSaved : false,
					isEnterprise: contact?.isEnterprise ?? false,
				};
				let fetchedContact: WAWebJS.Contact | null = null;

				if (!contact) {
					try {
						fetchedContact = await this.whatsapp
							.getClient()
							.getContactById(participant.id._serialized);
					} catch (err) {
						return null;
					}
					contact_details.name = fetchedContact.name ?? '';
					try {
						const country_code = await fetchedContact.getCountryCode();
						contact_details.country = COUNTRIES[country_code as string];
					} catch (err) {}
					contact_details.isBusiness = fetchedContact.isBusiness ? 'Business' : 'Personal';
					contact_details.public_name = fetchedContact.pushname;
					contact_details.isSaved = fetchedContact.isMyContact;
				}

				if (
					!(options.saved && options.unsaved) &&
					((options.saved && !contact_details.isSaved) ||
						(options.unsaved && contact_details.isSaved))
				) {
					return null;
				}

				if (!options.business_details) {
					return contact_details;
				}

				if (contact_details.isBusiness !== 'Business') {
					return null;
				}

				if (!fetchedContact) {
					try {
						fetchedContact = await this.whatsapp
							.getClient()
							.getContactById(participant.id._serialized);
					} catch (err) {
						return null;
					}
				}

				const business_details = WhatsappUtils.getBusinessDetails(
					fetchedContact as BusinessContact
				);
				return {
					...(contact_details as Partial<TGroupContact>),
					...(business_details as Partial<TGroupBusinessContact>),
				} as TGroupBusinessContact;
			})
		);

		return group_participants.filter((participant) => participant !== null) as T extends true
			? TGroupBusinessContact[]
			: TGroupContact[];
	}

	async getPendingGroupMembershipRequests(chat: GroupChat) {
		const requests = await chat.getGroupMembershipRequests();
		return await Promise.all(
			requests.map(async (request) => {
				const contact = await this.whatsapp
					.getClient()
					.getContactById((request.id as ContactId)._serialized);
				const contact_details = await this.getContactDetails(contact);
				return {
					...contact_details,
					group_name: chat.name,
				};
			})
		);
	}

	async getContactsByLabel(
		label_id: string,
		options: {
			saved: boolean;
			unsaved: boolean;
			business_details?: boolean;
			mapped_contacts: MappedContacts;
		}
	) {
		try {
			const chats = await this.whatsapp.getClient().getChatsByLabelId(label_id);
			const { name: label_name } = await this.whatsapp.getClient().getLabelById(label_id);
			const contactsPromises = chats
				.map(async (chat) => {
					if (chat.isGroup) {
						const participants = await this.getGroupContacts(chat as GroupChat, options);

						return participants.map((participant) => ({
							...participant,
							group_name: chat.name,
							label: label_name,
						})) as (TLabelContact | TLabelBusinessContact)[];
					} else {
						try {
							const contact = await this.whatsapp.getClient().getContactById(chat.id._serialized);

							const contact_details = await this.getContactDetails(contact);

							if (
								!(options.saved && options.unsaved) &&
								((options.saved && !contact_details.isSaved) ||
									(options.unsaved && contact_details.isSaved))
							) {
								return [];
							}

							if (!options.business_details) {
								return [
									{
										...contact_details,
										group_name: chat.name,
										label: label_name,
									} as TLabelContact,
								];
							}
							if (!contact.isBusiness) {
								return [];
							}
							const business_details = WhatsappUtils.getBusinessDetails(contact as BusinessContact);
							return [
								{
									...contact_details,
									...business_details,
									group_name: chat.name,
									label: label_name,
								} as TLabelBusinessContact,
							];
						} catch (err) {
							return [];
						}
					}
				})
				.flat();

			const arraysOfContacts = await Promise.all(contactsPromises);
			const flatContactsArray = arraysOfContacts.flat();
			return flatContactsArray;
		} catch (error) {
			return [];
		}
	}

	async createGroup(title: string, participants: string[]) {
		try {
			await this.whatsapp.getClient().createGroup(title, participants, {
				autoSendInviteV4: true,
			});
		} catch (error) {
			//ignored
		}
	}

	static async getCountryCode(contact: WAWebJS.Contact) {
		try {
			const country_code = (await contact.getFormattedNumber()).split(' ')[0];
			return country_code.replace('+', '').toString();
		} catch (error) {
			return '';
		}
	}

	static async removeUnwantedSessions() {
		if (!IS_PRODUCTION) return;
		const path = __basedir + '/.wwebjs_auth';
		if (!fs.existsSync(path)) {
			return;
		}
		const client_ids = (await fs.promises.readdir(path, { withFileTypes: true }))
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name.split('session-')[1]);

		for (const client_id of client_ids) {
			const { valid } = await DeviceService.isValidDevice(client_id);

			const path = __basedir + '/.wwebjs_auth';
			if (valid || !fs.existsSync(path)) {
				return;
			}
			WhatsappUtils.deleteSession(client_id);
			Logger.info('WHATSAPP-HELPER', `Removed ${client_id} as unwanted session`);
		}
	}

	static deleteSession(client_id: string) {
		WhatsappProvider.deleteSession(client_id);
		const path = __basedir + '/.wwebjs_auth/session-' + client_id;
		const dataExists = fs.existsSync(path);
		if (dataExists) {
			fs.rmSync(path, {
				recursive: true,
			});
			return true;
		}
		return false;
	}

	static async resumeSessions() {
		// if (!IS_PRODUCTION) return;
		const path = __basedir + '/.wwebjs_auth';

		await TaskDB.updateMany(
			{ status: TASK_STATUS.PENDING },
			{ $set: { status: TASK_STATUS.FAILED } }
		);

		if (!fs.existsSync(path)) {
			return;
		}
		const client_ids = (await fs.promises.readdir(path, { withFileTypes: true }))
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name.split('session-')[1]);

		const valid_sessions_promises = client_ids.map(async (client_id) => {
			const { valid } = await DeviceService.isValidDevice(client_id);
			if (valid) {
				return client_id;
			}
			return null;
		});

		const active_client_ids = (await Promise.all(valid_sessions_promises)).filter(
			(client_id) => client_id !== null
		) as string[];

		active_client_ids.forEach(async (client_id) => {
			const device = await DeviceService.getServiceByClientID(client_id);
			const instance = WhatsappProvider.getInstance(new UserService(device.getUser()), client_id);
			if (!instance) {
				return;
			}
			instance.initialize();
			Logger.info('WHATSAPP-HELPER', `Starting ${client_id} session`);

			setTimeout(() => {
				if (instance.isReady()) {
					return;
				}
				instance.destroyClient();
				WhatsappUtils.deleteSession(client_id);
				UserService.logout(client_id);
			}, SESSION_STARTUP_WAIT_TIME);
		});

		Logger.info('WHATSAPP-HELPER', `Started ${active_client_ids.length} client sessions`);
	}

	static async formatMessage(message: string, mapping: { [key: string]: string }) {
		Object.keys(mapping).forEach((key) => {
			message = message.replace(key, mapping[key]);
		});
		return message;
	}
}
