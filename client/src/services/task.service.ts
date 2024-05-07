import APIInstance from '../config/APIInstance';
import { TASK_RESULT_TYPE, TASK_STATUS } from '../hooks/useTask';

export default class TaskService {
	static async listTasks() {
		try {
			const { data } = await APIInstance.get(`/tasks`);

			return data.tasks.map(
				(task: {
					id: string;
					type: string;
					description: string;
					status: TASK_STATUS;
					data_result_type: TASK_RESULT_TYPE;
					createdAt: string;
					data?: string;
				}) => ({
					id: task.id as string,
					type: task.type as string,
					description: task.description as string,
					status: task.status as TASK_STATUS,
					data_result_type: task.data_result_type as TASK_RESULT_TYPE,
					data: (task.data as string) || undefined,
					createdAt: task.createdAt as string,
				})
			);
		} catch (err) {
			return [];
		}
	}

	static async downloadTaskResult(id: string) {
		try {
			const response = await APIInstance.get(`/tasks/${id}/download`, {
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

	static async removeTask(id: string) {
		try {
			await APIInstance.delete(`/tasks/${id}`);
			return true;
		} catch (err) {
			return false;
		}
	}
}
