import { json2csv } from 'json-2-csv';
import {
	AdminPaymentRecord,
	PaymentRecord,
	SubscriptionRecord,
} from '../types/payment/payment-bucket';
import {
	TBusinessContact,
	TContact,
	TGroupBusinessContact,
	TGroupContact,
	TLabelBusinessContact,
	TLabelContact,
} from '../types/whatsapp';

type UserDetails = {
	name: string;
	username: string;
	profile_name: string;
	phone: string;
	type: 'BUSINESS' | 'PERSONAL' | 'N/A';
	subscription_expiry: string;
	description: string;
	email: string;
	websites: string;
	latitude: number;
	longitude: number;
	address: string;
};

export default class CSVParser {
	static exportContacts(contacts: TContact[]) {
		const keys = [
			{
				field: 'public_name',
				title: 'Whatsapp Public Name',
			},
			{
				field: 'name',
				title: 'Name',
			},
			{
				field: 'number',
				title: 'Number',
			},
			{
				field: 'isBusiness',
				title: 'Is Business',
			},
			{
				field: 'country',
				title: 'Country',
			},
		];

		const csv = json2csv(contacts, {
			keys: keys,
			emptyFieldValue: '',
		});
		return csv;
	}
	static exportBusinessContacts(contacts: TBusinessContact[]) {
		const keys = [
			{
				field: 'public_name',
				title: 'Whatsapp Public Name',
			},
			{
				field: 'name',
				title: 'Name',
			},
			{
				field: 'number',
				title: 'Number',
			},
			{
				field: 'isBusiness',
				title: 'Is Business',
			},
			{
				field: 'email',
				title: 'Email',
			},
			{
				field: 'description',
				title: 'Description',
			},
			{
				field: 'address',
				title: 'Address',
			},
			{
				field: 'country',
				title: 'Country',
			},
			{
				field: 'latitude',
				title: 'Latitude',
			},
			{
				field: 'longitude',
				title: 'Longitude',
			},
			{
				field: 'websites',
				title: 'Websites',
			},
		];

		const csv = json2csv(contacts, {
			keys: keys,
			emptyFieldValue: '',
		});
		return csv;
	}
	static exportGroupContacts(contacts: TGroupContact[]) {
		const keys = [
			{
				field: 'group_id',
				title: 'Group ID',
			},
			{
				field: 'group_name',
				title: 'Group Name',
			},
			{
				field: 'user_type',
				title: 'User Type',
			},
			{
				field: 'public_name',
				title: 'Whatsapp Public Name',
			},
			{
				field: 'name',
				title: 'Name',
			},
			{
				field: 'number',
				title: 'Number',
			},
			{
				field: 'isBusiness',
				title: 'Is Business',
			},
			{
				field: 'country',
				title: 'Country',
			},
		];

		const csv = json2csv(contacts, {
			keys: keys,
			emptyFieldValue: '',
		});
		return csv;
	}
	static exportGroupBusinessContacts(contacts: TGroupBusinessContact[]) {
		const keys = [
			{
				field: 'group_id',
				title: 'Recipient ID',
			},
			{
				field: 'group_name',
				title: 'Group Name',
			},
			{
				field: 'user_type',
				title: 'User Type',
			},
			{
				field: 'public_name',
				title: 'Whatsapp Public Name',
			},
			{
				field: 'name',
				title: 'Name',
			},
			{
				field: 'number',
				title: 'Number',
			},
			{
				field: 'isBusiness',
				title: 'Is Business',
			},
			{
				field: 'email',
				title: 'Email',
			},
			{
				field: 'description',
				title: 'Description',
			},
			{
				field: 'address',
				title: 'Address',
			},
			{
				field: 'country',
				title: 'Country',
			},
			{
				field: 'latitude',
				title: 'Latitude',
			},
			{
				field: 'longitude',
				title: 'Longitude',
			},
			{
				field: 'websites',
				title: 'Websites',
			},
		];

		const csv = json2csv(contacts, {
			keys: keys,
			emptyFieldValue: '',
		});
		return csv;
	}
	static exportLabelContacts(contacts: TLabelContact[]) {
		const keys = [
			{
				field: 'label',
				title: 'Label',
			},
			{
				field: 'group_name',
				title: 'Group Name',
			},
			{
				field: 'public_name',
				title: 'Whatsapp Public Name',
			},
			{
				field: 'name',
				title: 'Name',
			},
			{
				field: 'number',
				title: 'Number',
			},
			{
				field: 'isBusiness',
				title: 'Is Business',
			},
			{
				field: 'country',
				title: 'Country',
			},
		];

		const csv = json2csv(contacts, {
			keys: keys,
			emptyFieldValue: '',
		});
		return csv;
	}
	static exportLabelBusinessContacts(contacts: TLabelBusinessContact[]) {
		const keys = [
			{
				field: 'label',
				title: 'Label',
			},
			{
				field: 'group_name',
				title: 'Group Name',
			},
			{
				field: 'public_name',
				title: 'Whatsapp Public Name',
			},
			{
				field: 'name',
				title: 'Name',
			},
			{
				field: 'number',
				title: 'Number',
			},
			{
				field: 'isBusiness',
				title: 'Is Business',
			},
			{
				field: 'email',
				title: 'Email',
			},
			{
				field: 'description',
				title: 'Description',
			},
			{
				field: 'address',
				title: 'Address',
			},
			{
				field: 'country',
				title: 'Country',
			},
			{
				field: 'latitude',
				title: 'Latitude',
			},
			{
				field: 'longitude',
				title: 'Longitude',
			},
			{
				field: 'websites',
				title: 'Websites',
			},
		];

		const csv = json2csv(contacts, {
			keys: keys,
			emptyFieldValue: '',
		});
		return csv;
	}

	static exportCampaignReport(
		records: {
			campaign_name: string;
			description: string;
			receiver: string;
			message: string;
			attachments: number;
			contacts: number;
			polls: number;
			status: string;
		}[]
	) {
		const keys = [
			{
				field: 'campaign_name',
				title: 'Campaign Name',
			},
			{
				field: 'description',
				title: 'Description',
			},
			{
				field: 'receiver',
				title: 'Recipient',
			},
			{
				field: 'message',
				title: 'Message',
			},
			{
				field: 'attachments',
				title: 'Attachments',
			},
			{
				field: 'contacts',
				title: 'Contacts',
			},
			{
				field: 'polls',
				title: 'Polls',
			},
			{
				field: 'status',
				title: 'Status',
			},
			{
				field: 'scheduled_at',
				title: 'Scheduled At',
			},
		];

		return json2csv(records, {
			keys: keys,
			emptyFieldValue: '',
		});
	}

	static exportSchedulerReport(
		records: {
			campaign_name: string;
			receiver: string;
			message: string;
			attachments: number;
			contacts: number;
			polls: number;
			status: string;
		}[]
	) {
		const keys = [
			{
				field: 'campaign_name',
				title: 'Scheduler Name',
			},
			{
				field: 'receiver',
				title: 'Recipient',
			},
			{
				field: 'message',
				title: 'Message',
			},
			{
				field: 'attachments',
				title: 'Attachments',
			},
			{
				field: 'contacts',
				title: 'Contacts',
			},
			{
				field: 'polls',
				title: 'Polls',
			},
			{
				field: 'status',
				title: 'Status',
			},
			{
				field: 'scheduled_at',
				title: 'Scheduled At',
			},
		];

		return json2csv(records, {
			keys: keys,
			emptyFieldValue: '',
		});
	}

	static exportPollReport(
		records: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
			voter_number: string;
			voter_name: string;
			group_name: string;
			selected_option: string[];
			voted_at: string;
		}[]
	): string {
		const keys = [
			{
				field: 'title',
				title: 'Title',
			},
			{
				field: 'options',
				title: 'Options',
			},
			{
				field: 'isMultiSelect',
				title: 'Multiple Select',
			},
			{
				field: 'voter_number',
				title: 'Number',
			},
			{
				field: 'voter_name',
				title: 'Name',
			},
			{
				field: 'group_name',
				title: 'Group name',
			},
			{
				field: 'selected_option',
				title: 'Selected Options',
			},
			{
				field: 'voted_at',
				title: 'Responded At',
			},
		];

		return json2csv(records, {
			keys: keys,
			emptyFieldValue: '',
		});
	}

	static exportPayments(records: (PaymentRecord | SubscriptionRecord)[]) {
		const keys = [
			{
				field: 'type',
				title: 'Type',
			},
			{
				field: 'date',
				title: 'Date',
			},
			{
				field: 'amount',
				title: 'Amount',
			},
			{
				field: 'plan',
				title: 'Plan',
			},
			{
				field: 'isActive',
				title: 'Is Active',
			},
			{
				field: 'isPaused',
				title: 'Is Paused',
			},
		];

		return json2csv(records, {
			keys: keys,
			emptyFieldValue: '',
		});
	}

	static exportPaymentsAdmin(records: AdminPaymentRecord[]) {
		const keys = [
			{
				field: 'transaction_date',
				title: 'Transaction Date',
			},
			{
				field: 'transaction_status',
				title: 'Transaction Status',
			},
			{
				field: 'name',
				title: 'Name',
			},
			{
				field: 'email',
				title: 'Email',
			},
			{
				field: 'phone_number',
				title: 'Phone Number',
			},
			{
				field: 'admin_number',
				title: 'Admin Number',
			},
			{
				field: 'whatsapp_numbers',
				title: 'Activated Numbers',
			},
			{
				field: 'plan',
				title: 'Plan',
			},
			{
				field: 'discount_coupon',
				title: 'Discount Coupon',
			},
			{
				field: 'gross_amount',
				title: 'Gross Amount',
			},
			{
				field: 'discount',
				title: 'Discount Amount',
			},
			{
				field: 'tax',
				title: 'Tax',
			},
			{
				field: 'total_amount',
				title: 'Total Amount',
			},
			{
				field: 'order_id',
				title: 'Order ID',
			},
			{
				field: 'payment_id',
				title: 'Payment ID',
			},
			{
				field: 'invoice_id',
				title: 'Invoice ID',
			},
			{
				field: 'billing_address.gstin',
				title: 'GSTIN',
			},
			{
				field: 'billing_address.street',
				title: 'Street',
			},
			{
				field: 'billing_address.city',
				title: 'City',
			},
			{
				field: 'billing_address.district',
				title: 'District',
			},
			{
				field: 'billing_address.state',
				title: 'State',
			},
			{
				field: 'billing_address.country',
				title: 'Country',
			},
			{
				field: 'billing_address.pincode',
				title: 'Pincode',
			},
		];

		return json2csv(records, {
			keys: keys,
			emptyFieldValue: '',
		});
	}

	static exportUsersDetails(records: UserDetails[]) {
		const keys = [
			{
				field: 'name',
				title: 'Name',
			},
			{
				field: 'username',
				title: 'Email',
			},
			{
				field: 'WhatsApp Public Name',
				title: 'Profile Name',
			},
			{
				field: 'phone',
				title: 'Phone Number',
			},
			{
				field: 'type',
				title: 'Is Business',
			},
			{
				field: 'email',
				title: 'Email',
			},
			{
				field: 'description',
				title: 'Description',
			},
			{
				field: 'address',
				title: 'Address',
			},
			{
				field: 'latitude',
				title: 'Latitude',
			},
			{
				field: 'longitude',
				title: 'Longitude',
			},
			{
				field: 'websites',
				title: 'Websites',
			},
			{
				field: 'subscription_expiry',
				title: 'Subscription Expires',
			},
		];

		return json2csv(records, {
			keys: keys,
			emptyFieldValue: '',
		});
	}

	static exportBotResponses(
		records: {
			trigger: string;
			recipient: string;
			triggered_at: string;
			triggered_by: string;
		}[]
	) {
		const keys = [
			{
				field: 'trigger',
				title: 'Trigger',
			},
			{
				field: 'recipient',
				title: 'Recipient',
			},
			{
				field: 'triggered_at',
				title: 'Triggered At',
			},
			{
				field: 'triggered_by',
				title: 'Triggered By',
			},
		];

		return json2csv(records, {
			keys: keys,
			emptyFieldValue: '',
		});
	}

	static exportMergedResponses(
		records: {
			recipient: string;
			group_name: string;
			reply_type: string;
			repliedAt: string;
		}[]
	) {
		const keys = [
			{
				field: 'recipient',
				title: 'Recipient',
			},
			{
				field: 'group_name',
				title: 'Group Name',
			},
			{
				field: 'reply_type',
				title: 'Replied As',
			},
			{
				field: 'repliedAt',
				title: 'Replied At',
			},
		];

		return json2csv(records, {
			keys: keys,
			emptyFieldValue: '',
		});
	}
}
