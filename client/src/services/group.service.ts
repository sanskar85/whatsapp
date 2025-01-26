import APIInstance from '../config/APIInstance';
import { MergedGroup } from '../store/types/MergeGroupState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processMergedGroup(group: any) {
	return {
		id: group.id as string,
		name: group.name as string,
		groups: group.groups as string[],
		group_reply_saved: group.group_reply_saved ?? [],
		group_reply_unsaved: group.group_reply_unsaved ?? [],
		private_reply_saved: group.private_reply_saved ?? [],
		private_reply_unsaved: group.private_reply_unsaved ?? [],
		private_reply_admin: group.private_reply_admin ?? [],
		restricted_numbers: group.restricted_numbers,
		min_delay: group.min_delay,
		max_delay: group.max_delay,
		reply_business_only: group.reply_business_only,
		random_string: group.random_string,
		active: group.active,
		canSendAdmin: group.canSendAdmin,
		multiple_responses: group.multiple_responses,
		options: group.options,
		triggers: group.triggers,
		forward: group.forward,
		allowed_country_codes: group.allowed_country_codes ?? [],
		start_time: group.start_time,
		end_time: group.end_time,
		moderator_rules: {
			admin_rule: {
				message: group.moderator_rules?.admin_rule?.message ?? '',
				shared_contact_cards: group.moderator_rules?.admin_rule?.shared_contact_cards ?? [],
				attachments: group.moderator_rules?.admin_rule?.attachments ?? [],
				polls: group.moderator_rules?.admin_rule?.polls ?? [],
			},
			creator_rule: {
				message: group.moderator_rules?.creator_rule?.message ?? '',
				shared_contact_cards: group.moderator_rules?.creator_rule?.shared_contact_cards ?? [],
				attachments: group.moderator_rules?.creator_rule?.attachments ?? [],
				polls: group.moderator_rules?.creator_rule?.polls ?? [],
			},
			group_rule: {
				message: group.moderator_rules?.group_rule?.message ?? '',
				shared_contact_cards: group.moderator_rules?.group_rule?.shared_contact_cards ?? [],
				attachments: group.moderator_rules?.group_rule?.attachments ?? [],
				polls: group.moderator_rules?.group_rule?.polls ?? [],
			},
			file_types: group?.file_types ?? [],
		},
	} as MergedGroup;
}

export default class GroupService {
	static async listGroups() {
		try {
			const { data } = await APIInstance.get(`/whatsapp/groups`);
			return data.groups.map(
				(group: { id: string; name: string; isMergedGroup: boolean; participants: number }) => ({
					id: group.id,
					name: group.name ?? '',
					name_with_id: `${group.name} (@${group.id.substring(
						group.id.length - 8,
						group.id.length - 5
					)}-${group.participants ?? 0})`,
					isMergedGroup: group.isMergedGroup ?? false,
					participants: group.participants ?? 0,
				})
			) as { id: string; name: string; isMergedGroup: boolean; participants: number }[];
		} catch (err) {
			return [];
		}
	}
	static async refreshGroups() {
		try {
			const { data } = await APIInstance.post(`/whatsapp/groups/refresh`);
			return data.groups.map(
				(group: { id: string; name: string; isMergedGroup: boolean; participants: number }) => ({
					id: group.id,
					name: group.name,
					name_with_id: `${group.name} (${group.id.substring(group.id.length - 8)})`,
					isMergedGroup: group.isMergedGroup,
					participants: group.participants ?? 0,
				})
			) as { id: string; name: string; isMergedGroup: boolean; participants: number }[];
		} catch (err) {
			return [];
		}
	}
	static async fetchGroup(
		ids: string[],
		{
			vcf_only = false,
			business_contacts_only = false,
			saved_contacts = false,
			non_saved_contacts = false,
			task_description,
		}: {
			vcf_only?: boolean;
			business_contacts_only?: boolean;
			saved_contacts?: boolean;
			non_saved_contacts?: boolean;
			task_description?: string;
		}
	) {
		try {
			await APIInstance.post(`/whatsapp/groups/export`, {
				vcf: vcf_only,
				business_contacts_only,
				group_ids: ids,
				saved: saved_contacts,
				unsaved: non_saved_contacts,
				task_description,
			});
			return true;
		} catch (err) {
			return false;
		}
	}
	static async createGroup(name: string, csv_file: string) {
		try {
			await APIInstance.post(`/whatsapp/groups`, { name, csv_file });
			return true;
		} catch (err) {
			return false;
		}
	}

	static async mergeGroups(details: MergedGroup) {
		try {
			const { data } = await APIInstance.post(`/whatsapp/groups/merge`, {
				group_name: details.name,
				group_ids: details.groups,
				group_reply_saved: details.group_reply_saved,
				group_reply_unsaved: details.group_reply_unsaved,
				private_reply_saved: details.private_reply_saved,
				private_reply_unsaved: details.private_reply_unsaved,
				restricted_numbers: details.restricted_numbers,
				min_delay: details.min_delay,
				max_delay: details.max_delay,
				reply_business_only: details.reply_business_only,
				random_string: details.random_string,
				canSendAdmin: details.canSendAdmin,
				multiple_responses: details.multiple_responses,
				triggers: details.triggers,
				options: details.options,
				forward: details.forward,
				allowed_country_codes: details.allowed_country_codes,
				private_reply_admin: details.private_reply_admin,
			});
			return processMergedGroup(data.group);
		} catch (err) {
			throw new Error('Error Saving group');
		}
	}

	static async mergedGroups() {
		try {
			const { data } = await APIInstance.get(`/whatsapp/groups/merge`);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return data.groups.map(processMergedGroup);
		} catch (err) {
			return [];
		}
	}

	static async editMergedGroup(id: string, details: MergedGroup) {
		try {
			const { data } = await APIInstance.patch(`/whatsapp/groups/merge/${id}`, {
				group_name: details.name,
				group_ids: details.groups,
				group_reply_saved: details.group_reply_saved,
				group_reply_unsaved: details.group_reply_unsaved,
				private_reply_saved: details.private_reply_saved,
				private_reply_unsaved: details.private_reply_unsaved,
				restricted_numbers: details.restricted_numbers,
				min_delay: details.min_delay,
				max_delay: details.max_delay,
				reply_business_only: details.reply_business_only,
				random_string: details.random_string,
				canSendAdmin: details.canSendAdmin,
				multiple_responses: details.multiple_responses,
				triggers: details.triggers,
				options: details.options,
				forward: details.forward,
				allowed_country_codes: details.allowed_country_codes,
				start_time: details.start_time,
				end_time: details.end_time,
				private_reply_admin: details.private_reply_admin,
			});
			return processMergedGroup(data.group);
		} catch (err) {
			throw new Error('Error Saving group');
		}
	}

	static async toggleActiveMergeGroup(id: string): Promise<boolean | null> {
		try {
			const { data } = await APIInstance.post(`/whatsapp/groups/merge/${id}/toggle-active`);
			return data.active;
		} catch (err) {
			return null;
		}
	}

	static async clearHistory(id: string): Promise<boolean> {
		try {
			await APIInstance.post(`/whatsapp/groups/merge/${id}/clear-responses`);
			return true;
		} catch (err) {
			return false;
		}
	}

	static async downloadResponses(id: string) {
		try {
			const response = await APIInstance.get(`/whatsapp/groups/merge/${id}/download-responses`, {
				responseType: 'blob',
			});

			const contentType = response.headers['content-type'];
			const blob = new Blob([response.data], { type: contentType });

			// Create a temporary link element
			const downloadLink = document.createElement('a');
			downloadLink.href = window.URL.createObjectURL(blob);

			const contentDispositionHeader = response.headers['content-disposition'];
			const fileNameMatch = contentDispositionHeader.match(/filename="(.+)"/);
			const fileName = fileNameMatch ? fileNameMatch[1] : 'download.csv';

			downloadLink.download = fileName; // Specify the filename

			// Append the link to the body and trigger the download
			document.body.appendChild(downloadLink);
			downloadLink.click();

			// Clean up - remove the link
			document.body.removeChild(downloadLink);
		} catch (err) {
			//ignore
		}
	}

	static async deleteMerged(id: string) {
		try {
			await APIInstance.delete(`/whatsapp/groups/merge/${id}`);
			return true;
		} catch (err) {
			return false;
		}
	}

	static async addProfilePicture(file: File, selectedGroups: string[]) {
		const formData = new FormData();
		formData.append('file', file);
		for (const group of selectedGroups) {
			formData.append('groups[]', group);
		}
		await APIInstance.put(`/whatsapp/groups`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return true;
	}

	static async updateProfileSettings(
		{
			description,
			edit_group_settings,
			send_messages,
			add_others,
			admin_group_settings,
		}: Partial<{
			description: string;
			edit_group_settings: boolean;
			send_messages: boolean;
			add_others: boolean;
			admin_group_settings: boolean;
		}>,
		selectedGroups: string[]
	) {
		await APIInstance.patch(`/whatsapp/groups`, {
			description,
			edit_group_settings,
			send_messages,
			add_others,
			admin_group_settings,
			groups: selectedGroups,
		});
		return true;
	}

	static async exportPendingRequests(selectedGroups: string[], task_description?: string) {
		await APIInstance.post(`/whatsapp/groups/pending-requests`, {
			groups: selectedGroups,
			task_description,
		});
		return true;
	}

	static async generateInviteDetails(links: string[], task_description?: string) {
		try {
			await APIInstance.post(`/whatsapp/groups/group-links`, {
				links: links,
				task_description,
			});
			return true;
		} catch (err) {
			return false;
		}
	}

	static async updateMessageModerationRules({
		details,
		merged_group_id,
	}: {
		merged_group_id: string;
		details: MergedGroup['moderator_rules'];
	}) {
		try {
			const { data } = await APIInstance.post(
				`/whatsapp/groups/merge/${merged_group_id}/message-moderator`,
				{
					file_types: details.file_types,
					group_rule: details.group_rule,
					admin_rule: details.admin_rule,
					creator_rule: details.creator_rule,
				}
			);
			return data.success;
		} catch (err) {
			return false;
		}
	}
}
