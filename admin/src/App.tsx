import { Suspense, lazy } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { NAVIGATION } from './config/const';

import { Flex, Image, Progress, Text } from '@chakra-ui/react';
import { LOGO } from './assets/Images';
import { useNavbar } from './hooks/useNavbar';
import { useTheme } from './hooks/useTheme';

const Login = lazy(() => import('./views/pages/login'));
const Dashboard = lazy(() => import('./views/pages/home/Dashboard'));
const UsersPage = lazy(() => import('./views/pages/users'));
const DevicesPage = lazy(() => import('./views/pages/devices'));
const Home = lazy(() => import('./views/pages/home'));
const NetworkError = lazy(() => import('./views/pages/network-error'));
const PaymentHistory = lazy(() => import('./views/pages/payment-history'));

function App() {
	useTheme();
	useNavbar();
	return (
		<Flex minHeight={'100vh'} width={'100vw'} className='bg-background dark:bg-background-dark'>
			<Router>
				<Suspense fallback={<Loading />}>
					<Routes>
						<Route path={NAVIGATION.LOGIN} element={<Login />} />
						<Route path={NAVIGATION.HOME} element={<Home />}>
							<Route path={NAVIGATION.DASHBOARD} element={<Dashboard />} />
							<Route path={NAVIGATION.USERS} element={<UsersPage />} />
							<Route path={NAVIGATION.DEVICE} element={<DevicesPage />} />
							<Route path={NAVIGATION.PAYMENT_HISTORY} element={<PaymentHistory />} />
						</Route>
						<Route path={NAVIGATION.NETWORK_ERROR} element={<NetworkError />} />
						<Route path='*' element={<Navigate to={NAVIGATION.LOGIN} />} />
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
