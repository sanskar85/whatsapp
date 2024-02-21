import fs from 'node:fs';
import type WAWebJS from '../../packages/whatsapp-web';
import type { BusinessContact, GroupChat } from '../../packages/whatsapp-web';
import { COUNTRIES, IS_PRODUCTION, SESSION_STARTUP_WAIT_TIME } from '../config/const';
import WhatsappProvider from '../providers/whatsapp';
import type {
	TBusinessContact,
	TContact,
	TGroupBusinessContact,
	TGroupContact,
	TLabelBusinessContact,
	TLabelContact,
} from '../types/whatsapp';
type MappedContact_ReturnType<T extends boolean> = T extends true
	? {
			[contact_number: string]: TBusinessContact;
	  }
	: {
			[contact_number: string]: TContact;
	  };



export default class WhatsappUtils {
	private whatsapp: WhatsappProvider;
	constructor(whatsapp: WhatsappProvider) {
		this.whatsapp = whatsapp;
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

	async getChatIDs(ids: string[]) {
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
	async getChatID(id: string) {
		const number_list = await this.getChatIDs([id]);
		return number_list.length > 0 ? number_list[0] : null;
	}

	async getParticipants(group_id: string) {
		const chat = await this.getChat(group_id);
		if (!chat || !chat.isGroup) {
			return [];
		}
		return (chat as GroupChat).participants.map((participant) => participant.id._serialized);
	}

	async getChatIdsByLabel(label_id: string) {
		if (!this.whatsapp.isBusiness()) {
			return [];
		}
		const chats = await this.whatsapp.getClient().getChatsByLabelId(label_id);
		return chats.map((chat) => chat.id._serialized);
	}

	static async getContactDetails(contact: WAWebJS.Contact) {
		const country_code = await contact.getCountryCode();
		const country = COUNTRIES[country_code as string];
		return {
			name: contact.name,
			number: contact.number,
			isBusiness: contact.isBusiness ? 'Business' : 'Personal',
			country,
			public_name: contact.pushname ?? '',
		};
	}
	static getBusinessDetails(contact: BusinessContact) {
		const business_contact = contact as BusinessContact;
		const business_details = business_contact.businessProfile as {
			description: string;
			email: string;
			website: string[];
			latitude: number;
			longitude: number;
			address: string;
		};

		return {
			description: business_details.description,
			email: business_details.email,
			websites: business_details.website,
			latitude: business_details.latitude,
			longitude: business_details.longitude,
			address: business_details.address,
		};
	}

	async contactsWithCountry<T extends boolean>(
		contacts: WAWebJS.Contact[],
		options: {
			business_details: T;
		} = {
			business_details: false as T,
		}
	): Promise<T extends true ? TBusinessContact[] : TContact[]> {
		const detailed_contacts = await Promise.all(
			contacts.map(async (contact) => {
				const contact_details = (await WhatsappUtils.getContactDetails(contact)) as TContact;
				if (!options.business_details) {
					return contact_details;
				}
				if (!contact.isBusiness) {
					return null;
				}
				const business_details = WhatsappUtils.getBusinessDetails(contact as BusinessContact);

				return {
					...contact_details,
					...business_details,
				} as TBusinessContact;
			})
		);

		const valid_contacts = detailed_contacts.filter((contact) => contact !== null);

		return valid_contacts as T extends true ? TBusinessContact[] : TContact[];
	}

	async getMappedContacts<T extends boolean>(
		business_contacts_only: T = false as T
	): Promise<MappedContact_ReturnType<T>> {
		const filtered_contacts = (await this.whatsapp.getClient().getContacts())
			.filter((contact) => contact.isMyContact && contact.name && contact.number)
			.filter((contact) => {
				if (!business_contacts_only) {
					return true;
				}
				return contact.isBusiness;
			});
		const contacts = await Promise.all(
			filtered_contacts.map(async (contact) => {
				const contact_details = await WhatsappUtils.getContactDetails(contact);
				if (!business_contacts_only) {
					return contact_details as TContact;
				} else {
					const business_details = WhatsappUtils.getBusinessDetails(contact as BusinessContact);
					return {
						...(contact_details as Partial<TContact>),
						...(business_details as Partial<TBusinessContact>),
					} as TBusinessContact;
				}
			})
		);
		const mapped_contacts = contacts.reduce(
			(acc, contact) => {
				acc[contact.number] = contact;
				return acc;
			},
			{} as T extends true
				? {
						[contact_number: string]: TBusinessContact;
				  }
				: {
						[contact_number: string]: TContact;
				  }
		);

		return mapped_contacts;
	}

	async getGroupContacts<T extends boolean>(
		groupChat: GroupChat,
		options: {
			business_details: T;
			mapped_contacts: MappedContact_ReturnType<T> | null;
		} = {
			business_details: false as T,
			mapped_contacts: null,
		}
	): Promise<T extends true ? TGroupBusinessContact[] : TGroupContact[]> {
		const contacts =
			options.mapped_contacts ?? (await this.getMappedContacts(options.business_details));

		const group_participants = await Promise.all(
			groupChat.participants.map(async (participant) => {
				const contact = contacts[participant.id.user];

				const contact_details: TGroupContact = {
					name: contact ? contact.name : '',
					number: participant.id.user,
					country: contact ? contact.country : '',
					isBusiness: contact ? contact.isBusiness : 'Personal',
					public_name: contact ? contact.public_name : '',
					group_name: groupChat.name,
					user_type: participant.isSuperAdmin ? 'CREATOR' : participant.isAdmin ? 'ADMIN' : 'USER',
				};
				let fetchedContact: WAWebJS.Contact | null = null;

				if (!contact) {
					fetchedContact = await this.whatsapp
						.getClient()
						.getContactById(participant.id._serialized);
					contact_details.name = fetchedContact.name ?? '';
					const country_code = await fetchedContact.getCountryCode();
					contact_details.country = COUNTRIES[country_code as string];
					contact_details.isBusiness = fetchedContact.isBusiness ? 'Business' : 'Personal';
					contact_details.public_name = fetchedContact.pushname;
				}

				if (!options.business_details) {
					return contact_details;
				}

				if (!contact.isBusiness) {
					return null;
				}

				if (!fetchedContact) {
					fetchedContact = await this.whatsapp
						.getClient()
						.getContactById(participant.id._serialized);
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

	async getContactsByLabel<T extends boolean>(
		label_id: string,
		options: {
			business_details: boolean;
			mapped_contacts: MappedContact_ReturnType<T> | null;
		} = {
			business_details: false,
			mapped_contacts: null,
		}
	) {
		try {
			const chats = await this.whatsapp.getClient().getChatsByLabelId(label_id);
			const label = await this.whatsapp.getClient().getLabelById(label_id);
			const contactsPromises = chats
				.map(async (chat) => {
					if (chat.isGroup) {
						const participants = await this.getGroupContacts(chat as GroupChat, {
							business_details: options.business_details,
							mapped_contacts: options.mapped_contacts,
						});

						return participants.map((participant) => ({
							...participant,
							group_name: chat.name,
							label: label.name,
						})) as (TLabelContact | TLabelBusinessContact)[];
					} else {
						const contact = await this.whatsapp.getClient().getContactById(chat.id._serialized);
						const contacts_details = await WhatsappUtils.getContactDetails(contact);
						if (!options.business_details) {
							return [
								{
									...contacts_details,
									group_name: chat.name,
									label: label.name,
								} as TLabelContact,
							];
						}
						if (!contact.isBusiness) {
							return [];
						}
						const business_details = WhatsappUtils.getBusinessDetails(contact as BusinessContact);
						return [
							{
								...contacts_details,
								...business_details,
								group_name: chat.name,
								label: label.name,
							} as TLabelBusinessContact,
						];
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
		await this.whatsapp.getClient().createGroup(title, participants, {
			autoSendInviteV4: true,
		});
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
		if (!IS_PRODUCTION) return;
		const path = __basedir + '/.wwebjs_auth';
		if (!fs.existsSync(path)) {
			return;
		}
		const client_ids = (await fs.promises.readdir(path, { withFileTypes: true }))
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name.split('session-')[1]);

		client_ids.forEach((client_id) => {
			const instance = WhatsappProvider.getInstance(client_id);
			instance.initialize();

			setTimeout(() => {
				if (instance.isReady()) {
					return;
				}
				instance.destroyClient();
				WhatsappUtils.deleteSession(client_id);
			}, SESSION_STARTUP_WAIT_TIME);
		});

		console.log('WHATSAPP-HELPER', `Started ${client_ids.length} client sessions`);
	}

	static getPollDetails(data: WAWebJS.Message) {
		return {
			title: data.pollName,
			options: (data.pollOptions as unknown as { name: string }[]).map((opt) => opt.name),
			isMultiSelect: data.allowMultipleAnswers,
			chat_id: data.to,
		};
	}
}
