import { Types } from 'mongoose';
import { DRIVE_SHARE_LINK } from '../../config/const';
import { UserLogPrefs } from '../../modules/user/user.validator';
import { addHeader, createSpreadSheet, shareToDrive } from '../../provider/google/SheetAuth';
import UserPreferencesDB from '../../repository/user/UserPreferences';
import { IUserPreferences } from '../../types/users';

export default class UserPreferencesService {
	private userPref: IUserPreferences;
	private username: string;

	private static instances = new Map<string, UserPreferencesService>();

	private constructor(userPref: IUserPreferences) {
		this.userPref = userPref;
		this.username = userPref.user.username;

		UserPreferencesService.instances.set(userPref.user._id.toHexString(), this);
	}

	static async getService(userId: Types.ObjectId) {
		if (this.instances.has(userId.toHexString())) {
			return this.instances.get(userId.toHexString())!;
		}

		const userPref = await UserPreferencesDB.findOne({ user: userId }).populate('user');
		if (userPref === null || userPref.user === null) {
			const doc = await UserPreferencesDB.create({ user: userId });
			const userPref = await doc.populate('user');
			return new UserPreferencesService(userPref);
		}

		return new UserPreferencesService(userPref);
	}

	isMessagesLogEnabled() {
		return this.userPref.isMessagesLogEnabled;
	}

	async setMessagesLogEnabled(enabled: boolean) {
		this.userPref.isMessagesLogEnabled = enabled;

		if (enabled && !this.getMessageLogSheetId()) {
			const sheetId = await createSpreadSheet(`Message Log @ ${this.username}`);
			addHeader(sheetId);
			shareToDrive(sheetId, DRIVE_SHARE_LINK);
			this.userPref.messageLogSheetId = sheetId;
		}

		await this.userPref.save();
	}

	getMessageLogSheetId() {
		return this.userPref.messageLogSheetId;
	}

	messagesLogPrefs() {
		return {
			individual_text_message: this.userPref.individual_text_message,
			individual_media_message: this.userPref.individual_media_message,
			group_text_message: this.userPref.group_text_message,
			group_media_message: this.userPref.group_media_message,
		};
	}

	async setMessageLogSheetId(sheetId: string | null) {
		this.userPref.messageLogSheetId = sheetId || '';
		await this.userPref.save();
	}

	async setMessagesLogPrefs(data: UserLogPrefs) {
		if (data.individual_text_message !== undefined) {
			this.userPref.individual_text_message = data.individual_text_message;
		}
		if (data.individual_media_message !== undefined) {
			this.userPref.individual_media_message = data.individual_media_message;
		}
		if (data.group_text_message !== undefined) {
			this.userPref.group_text_message = data.group_text_message;
		}
		if (data.group_media_message !== undefined) {
			this.userPref.group_media_message = data.group_media_message;
		}
		if (
			!this.userPref.individual_text_message &&
			!this.userPref.individual_media_message &&
			!this.userPref.group_text_message &&
			!this.userPref.group_media_message
		) {
			this.userPref.isMessagesLogEnabled = false;
		}

		await this.userPref.save();
	}
}
