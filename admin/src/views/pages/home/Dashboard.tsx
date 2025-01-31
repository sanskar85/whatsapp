import { Button, Grid, GridItem, HStack, useToast } from '@chakra-ui/react';
import { useRef } from 'react';
import { useTheme } from '../../../hooks/useTheme';
import ReportService from '../../../services/report.service';
import ClientId from './components/ClientId';
import BusinessLeadsDialog, { BusinessLeadsDialogHandle } from './components/LeadsDetailsDialog';
import PromotionalMessage from './components/PromotionalMessage';
import Token from './components/Token';

export default function Dashboard() {
	const theme = useTheme();
	const toast = useToast();
	const businessLeadsRef = useRef<BusinessLeadsDialogHandle>(null);

	const exportBusinessDetails = ({
		type,
		page,
		limit,
	}: {
		type: 'ALL' | 'GROUP_ALL' | 'GROUP_ADMINS';
		page: string;
		limit: string;
	}) => {
		toast.promise(ReportService.exportBusinessLeads({ type, page, limit }), {
			loading: { title: 'Exporting Business Leads...' },
			success: { title: 'Business Leads Exported Successfully' },
			error: { title: 'Failed to Export Business Leads' },
		});
	};

	return (
		<Grid p={'1rem'} textColor={theme === 'dark' ? 'white' : 'black'} gap={'1rem'}>
			<HStack>
				<Button onClick={() => businessLeadsRef.current?.open('ALL')}>
					Export Individual Business Leads
				</Button>
				<Button onClick={() => businessLeadsRef.current?.open('GROUP_ALL')}>
					Export Group Business Leads
				</Button>
				<Button onClick={() => businessLeadsRef.current?.open('GROUP_ADMINS')}>
					Export Admin Business Leads
				</Button>
			</HStack>
			<GridItem>
				<Token />
			</GridItem>
			<GridItem>
				<ClientId />
			</GridItem>
			<GridItem>
				<PromotionalMessage />
			</GridItem>
			<BusinessLeadsDialog ref={businessLeadsRef} onConfirm={exportBusinessDetails} />
		</Grid>
	);
}
