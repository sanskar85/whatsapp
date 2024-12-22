import APIInstance from '../config/APIInstance';

export default class ContactService {
	static async contactCount() {
		const { data } = await APIInstance.get(`/whatsapp/contacts/count`);
		return {
			phonebook_contacts: (data.phonebook_contacts as number) ?? 0,
			non_saved_contacts: (data.non_saved_contacts as number) ?? 0,
			chat_contacts: (data.chat_contacts as number) ?? 0,
			groups: (data.groups as number) ?? 0,
		};
	}
	static async contacts({
		saved_contacts = false,
		non_saved_contacts = false,
		saved_chat_contacts = false,
		vcf_only = false,
		business_contacts_only = false,
		task_description,
	}: {
		saved_contacts?: boolean;
		non_saved_contacts?: boolean;
		saved_chat_contacts?: boolean;
		vcf_only?: boolean;
		business_contacts_only?: boolean;
		task_description?: string;
	}) {
		console.log(task_description);
		try {
			await APIInstance.post(`/whatsapp/contacts`, {
				chat_contacts: saved_chat_contacts,
				saved: saved_contacts,
				unsaved: non_saved_contacts,
				business_contacts_only,
				vcf: vcf_only,
				task_description,
			});
			return true;
		} catch (err) {
			return false;
		}
	}
}
