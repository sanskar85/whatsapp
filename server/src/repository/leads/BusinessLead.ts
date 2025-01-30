import mongoose from 'mongoose';
import { RESTRICTED_NUMBERS } from '../../config/const';
import IBusinessLead from '../../types/leads/BusinessLead';

const businessLeadSchema = new mongoose.Schema<IBusinessLead>({
	number: {
		type: String,
		required: true,
	},
	country: String,
	public_name: String,
	isEnterprise: Boolean,
	description: String,
	email: String,
	websites: [String],
	latitude: Number,
	longitude: Number,
	address: String,
	isGroupContact: {
		type: Boolean,
		default: false,
	},
	group_details: {
		type: {
			group_id: { type: String, required: true },
			group_name: String,
			user_type: {
				type: String,
				enum: ['CREATOR', 'ADMIN', 'USER'],
			},
			description: String,
			participants: Number,
			canAddParticipants: String,
			canSendMessages: String,
		},
		default: undefined,
	},
});

// If isGroupContact is true, then group_details is required
businessLeadSchema.path('isGroupContact').validate(function (isGroupContact) {
	if (isGroupContact) {
		return this.group_details && this.group_details.group_id;
	}
	return true;
}, 'Group details are required when isGroupContact is true');

businessLeadSchema.path('number').validate(function (number) {
	if (RESTRICTED_NUMBERS.includes(number)) {
		return false;
	}
	return true;
}, 'Number is restricted');

businessLeadSchema.index(
	{ number: 1 },
	{ unique: true, partialFilterExpression: { isGroupContact: false } }
);

businessLeadSchema.index(
	{ number: 1, 'group_details.group_id': 1 },
	{ unique: true, partialFilterExpression: { isGroupContact: true } }
);

const BusinessLeadDB = mongoose.model<IBusinessLead>('BusinessLead', businessLeadSchema);

export default BusinessLeadDB;
