import { Suspense, lazy } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { NAVIGATION } from './config/const';

import { Flex, Image, Progress, Text } from '@chakra-ui/react';
import { LOGO } from './assets/Images';
import { useNavbar } from './hooks/useNavbar';
import { useTheme } from './hooks/useTheme';
import Open from './views/pages/open';

const Welcome = lazy(() => import('./views/pages/welcome'));
const Scheduler = lazy(() => import('./views/pages/scheduler'));
const Bot = lazy(() => import('./views/pages/bot'));
const Home = lazy(() => import('./views/pages/home'));
const Tasks = lazy(() => import('./views/pages/tasks'));
const Report = lazy(() => import('./views/pages/report'));
const LinkShortner = lazy(() => import('./views/pages/link-shortner'));
const Contact = lazy(() => import('./views/pages/contacts'));
const Attachments = lazy(() => import('./views/pages/attachments'));
const CSVUpload = lazy(() => import('./views/pages/csv-upload'));
const PollReport = lazy(() => import('./views/pages/polls-report'));
const GroupMergePage = lazy(() => import('./views/pages/merge-group'));
const NetworkError = lazy(() => import('./views/pages/network-error'));
const APIPage = lazy(() => import('./views/pages/api-webhook'));
const SchedulerByDate = lazy(() => import('./views/pages/scheduler-by-date'));
const Logger = lazy(() => import('./views/pages/logger'));

function App() {
	useTheme();
	useNavbar();
	return (
		<Flex minHeight={'100vh'} width={'100vw'} className='bg-background dark:bg-background-dark'>
			<Router>
				<Suspense fallback={<Loading />}>
					<Routes>
						<Route path={NAVIGATION.WELCOME} element={<Welcome />} />
						<Route path={NAVIGATION.OPEN + '/:id'} element={<Open />} />
						<Route path={NAVIGATION.HOME} element={<Home />}>
							<Route path={NAVIGATION.CONTACT} element={<Contact />} />
							<Route path={NAVIGATION.SCHEDULER} element={<Scheduler />} />
							<Route path={NAVIGATION.SCHEDULER_BY_DATE} element={<SchedulerByDate />} />
							<Route path={NAVIGATION.BOT} element={<Bot />} />
							<Route path={NAVIGATION.REPORTS} element={<Report />} />
							<Route path={NAVIGATION.SHORT} element={<LinkShortner />} />
							<Route path={NAVIGATION.ATTACHMENTS} element={<Attachments />} />
							<Route path={NAVIGATION.CSV} element={<CSVUpload />} />
							<Route path={NAVIGATION.POLL_RESPONSES} element={<PollReport />} />
							<Route path={NAVIGATION.GROUP_MERGE} element={<GroupMergePage />} />
							<Route path={NAVIGATION.TASKS} element={<Tasks />} />
							<Route path={NAVIGATION.API} element={<APIPage />} />
							<Route path={NAVIGATION.ENHANCEMENT} element={<Logger />} />
						</Route>
						<Route path={NAVIGATION.NETWORK_ERROR} element={<NetworkError />} />
						<Route path='*' element={<Navigate to={NAVIGATION.WELCOME} />} />
					</Routes>
				</Suspense>
			</Router>
		</Flex>
	);
}

const Loading = () => {
	return (
		<Flex
			direction={'column'}
			justifyContent={'center'}
			alignItems={'center'}
			flexDirection='column'
			width={'100vw'}
			height={'100vh'}
		>
			<Flex
				direction={'column'}
				justifyContent={'center'}
				alignItems={'center'}
				flexDirection='column'
				padding={'3rem'}
				rounded={'lg'}
				width={'500px'}
				height={'550px'}
				className='border shadow-xl drop-shadow-xl '
			>
				<Flex justifyContent={'center'} alignItems={'center'} direction={'column'} gap={'3rem'}>
					<Flex justifyContent={'center'} alignItems={'center'} width={'full'} gap={'1rem'}>
						<Image src={LOGO} width={'48px'} className='shadow-lg rounded-full' />
						<Text className='text-black dark:text-white' fontSize={'lg'} fontWeight='bold'>
							WhatsLeads
						</Text>
					</Flex>
					<Progress size='xs' isIndeterminate width={'150%'} rounded={'lg'} />
				</Flex>
			</Flex>
		</Flex>
	);
};

export default App;
