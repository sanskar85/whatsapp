import { Types } from 'mongoose';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import TemplateDB from '../../repository/template';
import { IUser } from '../../types/users';

export default class TemplateService {
	private user: IUser;

	public constructor(user: IUser) {
		this.user = user;
	}

	async listMessageTemplates() {
		const templates = await TemplateDB.find({ user: this.user, type: 'MESSAGE' });
		return templates.map((template) => ({
			id: template._id as string,
			name: template.name,
			message: template.message,
		}));
	}

	addMessageTemplate(name: string, message: string) {
		const template = new TemplateDB({ user: this.user, name, message, type: 'MESSAGE' });
		template.save();
		return {
			id: template._id as string,
			name: template.name,
			message: template.message,
		};
	}

	async deleteTemplate(id: Types.ObjectId) {
		const template = await TemplateDB.findById(id);
		if (!template) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		template.remove();
	}

	async updateMessageTemplate(id: Types.ObjectId, name: string, message: string) {
		const template = await TemplateDB.findOne({ user: this.user, _id: id, type: 'MESSAGE' });
		if (!template) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		if (name) {
			template.name = name;
		}
		if (message) {
			template.message = message;
		}
		template.save();
		return {
			id: template._id,
			name: template.name,
			message: template.message,
		};
	}

	async listPollTemplates() {
		const templates = await TemplateDB.find({ user: this.user, type: 'POLL' });
		return templates.map((template) => ({
			id: template._id as string,
			name: template.name,
			poll: template.poll,
		}));
	}

	addPollTemplate(
		name: string,
		poll: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}
	) {
		const template = new TemplateDB({ user: this.user, name, poll, type: 'POLL' });
		template.save();
		return {
			id: template._id as string,
			name: template.name,
			poll: template.poll,
		};
	}

	async updatePollTemplate(
		id: Types.ObjectId,
		name: string,
		poll: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}
	) {
		const template = await TemplateDB.findOne({ user: this.user, _id: id, type: 'POLL' });
		if (!template) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		if (name) {
			template.name = name;
		}
		template.poll = poll;
		template.save();
		return {
			id: template._id,
			name: template.name,
			poll: template.poll,
		};
	}
}
