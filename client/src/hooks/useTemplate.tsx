import { useEffect, useState } from 'react';
import TemplateService from '../services/template.service';

export default function useTemplate() {
	const [isLoading, setLoading] = useState(false);
	const [addingTemplate, setAddingTemplate] = useState(false);
	const [templates, setTemplates] = useState<
		{
			id: string;
			name: string;
			message: string;
		}[]
	>([]);

	useEffect(() => {
		setLoading(true);
		TemplateService.listTemplate()
			.then(setTemplates)
			.finally(() => setLoading(false));
	}, []);

	const add = (name: string, message: string) => {
		setAddingTemplate(true);
		TemplateService.createTemplate({ name, message })
			.then((res) => {
				if (!res) return;
				setTemplates((prev) => [...prev, res]);
			})
			.finally(() => {
				setAddingTemplate(false);
			});
	};

	const remove = (id: string) => {
		setAddingTemplate(true);
		TemplateService.deleteTemplate(id)
			.then((res) => {
				if (!res) return;
				setTemplates((prev) => prev.filter((t) => t.id !== id));
			})
			.finally(() => {
				setAddingTemplate(false);
			});
	};

	const update = (id: string, name: string, message: string) => {
		setAddingTemplate(true);
		TemplateService.updateTemplate({ id, name, message })
			.then((res) => {
				if (!res) return;
				setTemplates((prev) => prev.map((t) => (t.id !== id ? t : res)));
			})
			.finally(() => {
				setAddingTemplate(false);
			});
	};

	return { templates, isLoading, add, addingTemplate, update, remove };
}
