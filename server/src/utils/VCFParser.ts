import { TBusinessContact, TContact } from '../types/whatsapp';
import VCardBuilder from './VCardBuilder';

export default class VCFParser {
	static exportContacts(contacts: TContact[]) {
		const vCardString = contacts.reduce((acc, contact) => {
			const text = new VCardBuilder({})
				.setFirstName(contact.name ?? contact.public_name)
				.setContactPhone(contact.number, contact.number)
				.build();
			return acc + text + '\n';
		}, '');
		return vCardString;
	}
	static exportBusinessContacts(contacts: TBusinessContact[]) {
		const vCardString = contacts.reduce((acc, contact) => {
			const text = new VCardBuilder({})
				.setFirstName(contact.name ?? contact.public_name)
				.setContactPhone(contact.number, contact.number)
				.setWorkEmail(contact.email)
				.build();
			return acc + text + '\n';
		}, '');
		return vCardString;
	}
}
