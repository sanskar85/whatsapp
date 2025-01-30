import { Button, Grid, GridItem } from '@chakra-ui/react';
import { useTheme } from '../../../hooks/useTheme';
import ReportService from '../../../services/report.service';
import ClientId from './components/ClientId';
import PromotionalMessage from './components/PromotionalMessage';
import Token from './components/Token';

export default function Dashboard() {
	const theme = useTheme();

	const handleExportBusinessLeads = () => {
		ReportService.exportBusinessLeads();
	};

	return (
		<Grid p={'1rem'} textColor={theme === 'dark' ? 'white' : 'black'} gap={'1rem'}>
			<Button className='w-64' onClick={handleExportBusinessLeads}>
				Export Business Leads
			</Button>
			<GridItem>
				<Token />
			</GridItem>
			<GridItem>
				<ClientId />
			</GridItem>
			<GridItem>
				<PromotionalMessage />
			</GridItem>
		</Grid>
	);
}
