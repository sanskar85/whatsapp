export type TContact = {
	name: string;
	number: string;
	country: string;
	isBusiness: string;
	public_name: string;
};

export type TBusinessContact = TContact & {
	description: string;
	email: string;
	websites: string[];
	latitude: number;
	longitude: number;
	address: string;
};

type GroupDetails = {
	id: string;
	name: string;
	isMergedGroup: boolean;
	participants: number;
};

type ContactGroupDetails = {
	group_id: string;
	group_name: string;
	user_type: 'CREATOR' | 'ADMIN' | 'USER';
	description?: string;
	participants?: number;
	canAddParticipants?: string;
};
type LabelDetails = {
	group_name: string;
	label: string;
};

export type TGroupContact = TContact & ContactGroupDetails;
export type TGroupBusinessContact = TBusinessContact & ContactGroupDetails;

export type TLabelContact = TContact & LabelDetails;
export type TLabelBusinessContact = TBusinessContact & LabelDetails;
