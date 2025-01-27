import { Types } from 'mongoose';
import { DRIVE_SHARE_LINK } from '../../config/const';
import { addHeader, createSpreadSheet, shareToDrive } from '../../provider/google/SheetAuth';
import UserPreferencesDB from '../../repository/user/UserPreferences';
import { IUserPreferences } from '../../types/users';

export default class UserPreferencesService {
	private userPref: IUserPreferences;
	private username: string;
	private static instances = new Map<string, UserPreferencesService>();

	private constructor(userPref: IUserPreferences, username: string) {
		this.userPref = userPref;
		this.username = username;

		UserPreferencesService.instances.set(userPref.user.toString() as unknown as string, this);
	}

	static async getService(userId: Types.ObjectId) {
		if (this.instances.has(userId.toString())) {
			return this.instances.get(userId.toString())!;
		}

		const userPref = await UserPreferencesDB.findOne({ user: userId }).populate('user');
		if (userPref === null || userPref.user === null) {
			await UserPreferencesDB.create({ user: userId });

			const userPref = await UserPreferencesDB.findOne({ user: userId }).populate('user');
			return new UserPreferencesService(userPref!, userPref!.user.username);
		}

		return new UserPreferencesService(userPref, userPref.user.username);
	}

	isLoggerEnabled() {
		return this.userPref.isLoggerEnabled;
	}

	async setLoggerEnabled(enabled: boolean) {
		this.userPref.isLoggerEnabled = enabled;
		if (enabled && !this.getMessageLogSheetId()) {
			const sheetId = await createSpreadSheet(`Message Log @ ${this.username}`);
			addHeader(sheetId);
			shareToDrive(sheetId, DRIVE_SHARE_LINK);
			this.userPref.messageLogSheetId = sheetId;
		}
		await this.userPref.save();
	}

	getMessageLogRules() {
		return this.userPref.messageLogRules;
	}

	async addMessageLogRule(
		rules: {
			id: string;
			name: string;
			saved: boolean;
			unsaved: boolean;
			include: string[];
			exclude: string[];
			loggers: string[];
		}[]
	) {
		for (const rule of rules) {
			this.userPref.messageLogRules[rule.id] = rule;
		}
		await UserPreferencesDB.updateOne(
			{ user: this.userPref.user },
			{ $set: { messageLogRules: this.userPref.messageLogRules } }
		);
	}

	async updateMessageLogRule(rule: {
		id: string;
		saved: boolean;
		unsaved: boolean;
		include: string[];
		exclude: string[];
		loggers: string[];
	}) {
		this.userPref.messageLogRules[rule.id] = {
			id: rule.id,
			name: this.userPref.messageLogRules[rule.id].name,
			saved: rule.saved,
			unsaved: rule.unsaved,
			include: rule.include,
			exclude: rule.exclude,
			loggers: rule.loggers,
		};
		await UserPreferencesDB.updateOne(
			{ user: this.userPref.user },
			{ $set: { messageLogRules: this.userPref.messageLogRules } }
		);
	}

	async deleteMessageLogRule(id: string) {
		delete this.userPref.messageLogRules[id];
		await UserPreferencesDB.updateOne(
			{ user: this.userPref.user },
			{ $set: { messageLogRules: this.userPref.messageLogRules } }
		);
	}

	getMessageLogSheetId() {
		return this.userPref.messageLogSheetId;
	}

	isMessageStarEnabled() {
		return (
			this.userPref.messageStarRules.individual_outgoing_messages ||
			this.userPref.messageStarRules.individual_incoming_messages ||
			this.userPref.messageStarRules.group_outgoing_messages ||
			this.userPref.messageStarRules.group_incoming_messages
		);
	}

	getMessageStarRules() {
		return this.userPref.messageStarRules;
	}

	async setMessageStarRules(rules: {
		individual_outgoing_messages: boolean;
		individual_incoming_messages: boolean;
		group_outgoing_messages: boolean;
		group_incoming_messages: boolean;
	}) {
		this.userPref.messageStarRules = rules;
		await UserPreferencesDB.updateOne(
			{ user: this.userPref.user },
			{ $set: { messageStarRules: this.userPref.messageStarRules } }
		);
	}

	async addMediaModerationRule(
		rules: {
			id: string;
			name: string;
			restricted_medias: string[];
		}[]
	) {
		for (const rule of rules) {
			this.userPref.mediaModerationRules[rule.id] = rule;
		}
		await UserPreferencesDB.updateOne(
			{ user: this.userPref.user },
			{ $set: { mediaModerationRules: this.userPref.mediaModerationRules } }
		);
	}

	async updateMediaModerationRule(rule: { id: string; restricted_medias: string[] }) {
		this.userPref.mediaModerationRules[rule.id] = {
			id: rule.id,
			name: this.userPref.mediaModerationRules[rule.id].name,
			restricted_medias: rule.restricted_medias,
		};
		await UserPreferencesDB.updateOne(
			{ user: this.userPref.user },
			{ $set: { mediaModerationRules: this.userPref.mediaModerationRules } }
		);
	}

	async deleteMediaModerationRule(id: string) {
		delete this.userPref.mediaModerationRules[id];
		await UserPreferencesDB.updateOne(
			{ user: this.userPref.user },
			{ $set: { mediaModerationRules: this.userPref.mediaModerationRules } }
		);
	}

	getMediaModerationRules() {
		return this.userPref.mediaModerationRules;
	}
}
