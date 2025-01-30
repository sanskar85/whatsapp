import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { BusinessLeadsService } from '../../services/leads';
import { CampaignService } from '../../services/messenger';
import VoteResponseService from '../../services/vote-response';
import CSVParser from '../../utils/CSVParser';
import { Respond, RespondCSV } from '../../utils/ExpressUtils';

async function listCampaigns(req: Request, res: Response, next: NextFunction) {
	const messages = await new CampaignService(req.locals.user.getUser()).allCampaigns();
	return Respond({
		res,
		status: 200,
		data: {
			report: messages,
		},
	});
}
async function pauseCampaign(req: Request, res: Response, next: NextFunction) {
	new CampaignService(req.locals.user.getUser()).pauseCampaign(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {},
	});
}
async function deleteCampaign(req: Request, res: Response, next: NextFunction) {
	new CampaignService(req.locals.user.getUser()).deleteCampaign(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {},
	});
}
async function resumeCampaign(req: Request, res: Response, next: NextFunction) {
	new CampaignService(req.locals.user.getUser()).resumeCampaign(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function generateReport(req: Request, res: Response, next: NextFunction) {
	try {
		const scheduler = new CampaignService(req.locals.user.getUser());
		const reports = await scheduler.generateReport(req.locals.id);
		return RespondCSV({
			res,
			filename: 'Campaign Reports',
			data: CSVParser.exportCampaignReport(reports),
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND)) {
				return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function listPolls(req: Request, res: Response, next: NextFunction) {
	const service = new VoteResponseService(req.locals.user.getUser());
	const { title, options, isMultiSelect, export_csv } = req.query;

	if (!title || !options || !isMultiSelect) {
		if (export_csv === 'true') {
			const polls = await service.getPolls();
			return RespondCSV({
				res,
				filename: 'Poll Reports',
				data: CSVParser.exportPollReport(polls),
			});
		}

		const polls = await service.allPolls();

		return Respond({
			res,
			status: 200,
			data: { polls },
		});
	}

	const polls = await service.getPoll({
		title: String(title),
		options: (options as string).split('|$|'),
		isMultiSelect: String(isMultiSelect) === 'true',
	});

	if (export_csv === 'true') {
		return RespondCSV({
			res,
			filename: 'Poll Reports',
			data: CSVParser.exportPollReport(polls),
		});
	}
	return Respond({
		res,
		status: 200,
		data: {
			polls,
		},
	});
}

async function listLeads(req: Request, res: Response, next: NextFunction) {
	const leads = await BusinessLeadsService.fetchBusinessLeads();

	const processed_leads = leads.map((lead) => {
		return {
			number: lead.number?.toString() || '',
			country: lead.country?.toString() || '',
			public_name: lead.public_name?.toString() || '',
			isEnterprise: lead.isEnterprise ? 'Enterprise' : 'Not Enterprise',
			description: lead.description?.toString() || '',
			email: lead.email?.toString() || '',
			websites: lead.websites?.join(', ') || '',
			latitude: lead.latitude?.toString() || '',
			longitude: lead.longitude?.toString() || '',
			address: lead.address?.toString() || '',
			isGroupContact: lead.isGroupContact ? 'Group Contact' : 'Not Group Contact',
			group_id: lead.group_details?.group_id || '',
			group_name: lead.group_details?.group_name || '',
			user_type: lead.group_details?.user_type || '',
			group_description: lead.group_details?.description || '',
			participants: (lead.group_details?.participants || 0).toString() || '',
			canAddParticipants: lead.group_details?.canAddParticipants || '',
			canSendMessages: lead.group_details?.canSendMessages || '',
		};
	});
	return RespondCSV({
		res,
		filename: 'Leads',
		data: CSVParser.exportBusinessLeadReport(processed_leads),
	});
}

const ReportController = {
	listCampaigns,
	pauseCampaign,
	resumeCampaign,
	deleteCampaign,
	generateReport,
	listPolls,
	listLeads,
};

export default ReportController;
