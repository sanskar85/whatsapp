import Logger from 'n23-logger';
import { GroupChat } from 'whatsapp-web.js';
import { getOrCache } from '../../config/cache';
import { CACHE_TOKEN_GENERATOR } from '../../config/const';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import BusinessLeadDB from '../../repository/leads/BusinessLead';
import { TBusinessContact, TGroupBusinessContact } from '../../types/whatsapp';
import WhatsappUtils, { MappedContacts } from '../../utils/WhatsappUtils';

type CreateBusinessLead = {
	number: string;
	country: string;
	public_name: string;
	isEnterprise: boolean;
	description: string;
	email: string;
	websites: string[];
	latitude: number;
	longitude: number;
	address: string;
	isGroupContact: boolean;
	group_details?: {
		group_id: string;
		group_name: string;
		user_type: 'CREATOR' | 'ADMIN' | 'USER';
		description?: string;
		participants?: number;
		canAddParticipants?: string;
		canSendMessages?: string;
	};
};

export default class BusinessLeadsService {
	private static instance: BusinessLeadsService;

	private constructor() {}

	static getInstance() {
		if (!BusinessLeadsService.instance) {
			BusinessLeadsService.instance = new BusinessLeadsService();
		}
		return BusinessLeadsService.instance;
	}

	async processWhatsappInstance(user_id: string, whatsapp: WhatsappProvider) {
		if (!whatsapp) {
			return;
		}
		const whatsappUtils = new WhatsappUtils(whatsapp);
		if (!whatsapp.isReady()) {
			return;
		}
		const user_number = whatsapp.getClient().info.wid.user;

		const processed_contacts = await this.processIndividualContact(whatsappUtils, user_id);
		if (!processed_contacts) {
			Logger.info('LEADS PROCESSING', `Individual contacts processing failed @${user_number}`);
			return;
		}
		Logger.info(
			'LEADS PROCESSING',
			`Individual contacts processed @${user_number} ${processed_contacts.length}`
		);
		const group_contacts = await this.processGroupContact(
			whatsappUtils,
			user_id,
			processed_contacts
		);
		if (!group_contacts) {
			Logger.info('LEADS PROCESSING', `Group contacts processing failed @${user_number}`);
			return;
		}
		Logger.info(
			'LEADS PROCESSING',
			`Group contacts processed @${user_number} ${group_contacts.length}`
		);
	}

	async processIndividualContact(whatsappUtils: WhatsappUtils, user_id: string) {
		try {
			const { saved, non_saved } = await getOrCache(CACHE_TOKEN_GENERATOR.CONTACTS(user_id), () =>
				whatsappUtils.getContacts()
			);
			const business_contacts = [...saved, ...non_saved].filter((c) => c.isBusiness);

			const contacts = (await whatsappUtils.contactsWithCountry(
				business_contacts
			)) as TBusinessContact[];
			const processed_contacts = contacts.map((c) => {
				return {
					number: c.number,
					country: c.country,
					public_name: c.public_name,
					isEnterprise: c.isEnterprise,
					description: c.description,
					email: c.email,
					websites: c.websites,
					latitude: c.latitude,
					longitude: c.longitude,
					address: c.address,
					isGroupContact: false,
				};
			});
			await BusinessLeadsService.createBusinessLeads(processed_contacts);

			return processed_contacts;
		} catch (err) {
			return null;
		}
	}

	async processGroupContact(
		whatsappUtils: WhatsappUtils,
		user_id: string,
		contacts: CreateBusinessLead[]
	) {
		const { groups } = await getOrCache(CACHE_TOKEN_GENERATOR.CONTACTS(user_id), () =>
			whatsappUtils.getContacts()
		);

		const group_ids = groups.map((g) => g.id);

		try {
			const mapped_contacts = contacts.reduce((acc, contact) => {
				acc[contact.number] = {
					name: contact.public_name ?? '',
					isSaved: true,
					public_name: contact.public_name ?? '',
					number: contact.number ?? '',
					isBusiness: 'Business',
					country: contact.country ?? '',
					description: contact.description ?? '',
					email: contact.email ?? '',
					websites: contact.websites ?? [],
					latitude: contact.latitude ?? 0,
					longitude: contact.longitude ?? 0,
					address: contact.address ?? '',
					isEnterprise: contact.isEnterprise,
				};
				return acc;
			}, {} as MappedContacts);

			const groups = (
				await Promise.all(
					group_ids.map(async (group_id) => {
						try {
							const chat = await whatsappUtils.getChat(group_id);
							if (!chat || !chat.isGroup) {
								throw new Error('Group not found');
							}
							return chat as GroupChat;
						} catch (err) {
							return null;
						}
					})
				)
			).filter((chat) => chat !== null) as GroupChat[];

			const participants: TGroupBusinessContact[] = (
				await Promise.all(
					groups.map(async (groupChat) => {
						const participants = await whatsappUtils.getGroupContacts(groupChat, {
							saved: true,
							unsaved: true,
							business_details: true,
							mapped_contacts: mapped_contacts,
						});

						participants.forEach((participant) => {
							if (participant.user_type === 'ADMIN' || participant.user_type === 'CREATOR') {
								participant.description = groupChat.description;
								participant.participants = groupChat.participants.length;
								participant.canAddParticipants =
									groupChat.memberAddMode === 'all_member_add' ? 'Allowed' : 'Not Allowed';
								participant.canSendMessages = !groupChat.announce ? 'Allowed' : 'Not Allowed';
							}
						});

						return participants;
					})
				)
			).flat() as TGroupBusinessContact[];

			const processed_contacts = participants.map((p) => {
				return {
					number: p.number,
					country: p.country,
					public_name: p.public_name,
					isEnterprise: p.isEnterprise,
					description: p.description,
					email: p.email,
					websites: p.websites,
					latitude: p.latitude,
					longitude: p.longitude,
					address: p.address,
					isGroupContact: true,
					group_details: {
						group_id: p.group_id,
						group_name: p.group_name,
						user_type: p.user_type,
						description: p.description,
						participants: p.participants,
						canAddParticipants: p.canAddParticipants,
						canSendMessages: p.canSendMessages,
					},
				};
			});
			await BusinessLeadsService.createBusinessLeads(processed_contacts);

			return processed_contacts;
		} catch (err) {
			return null;
		}
	}

	static async createBusinessLeads(data: CreateBusinessLead | CreateBusinessLead[]) {
		const data_array = Array.isArray(data) ? data : [data];
		try {
			await BusinessLeadDB.insertMany(data_array, {
				ordered: false,
			});
		} catch (err) {}
	}

	static async fetchBusinessLeads() {
		const leads = await BusinessLeadDB.find();
		return leads;
	}
}
