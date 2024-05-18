import { Document, Types } from 'mongoose';
import { MESSAGE_SCHEDULER_TYPE, MESSAGE_STATUS } from '../../config/const';
import { IDevice, IUser } from '../users';

export default interface IMessage extends Document {
	sender: IUser;
	device: IDevice;
	receiver: string;
	message: string;
	status: MESSAGE_STATUS;
	shared_contact_cards: IContactCard[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	attachments: {
		name: string;
		filename: string;
		caption: string;
	}[];
	createdAt: Date;
	sendAt: Date;

	scheduled_by: {
		type: MESSAGE_SCHEDULER_TYPE;
		id: Types.ObjectId;
	};
}
