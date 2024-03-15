import { Flex, Image, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LOGO } from '../../../assets/Images';
import { Colors, NAVIGATION } from '../../../config/const';
import { useAuth } from '../../../hooks/useAuth';
import { useNetwork } from '../../../hooks/useNetwork';
import LoadingPage from '../../components/loading-page';
import LoginTab from './component/LoginTab';
import SignupTab from './component/SignupTab';

export default function Welcome() {
	const status = useNetwork();
	const navigate = useNavigate();
	const { isAuthenticated, isValidating } = useAuth();

	useEffect(() => {
		if (status === 'NO-NETWORK') {
			navigate(NAVIGATION.NETWORK_ERROR);
		}
	}, [status, navigate]);

	if (isValidating) {
		return <LoadingPage />;
	}
	if (isAuthenticated) {
		return <Navigate to={NAVIGATION.HOME} />;
	}

	return (
		<Flex
			direction={'column'}
			justifyContent={'center'}
			alignItems={'center'}
			flexDirection='column'
			width={'100vw'}
			height={'100vh'}
			backgroundColor={Colors.BACKGROUND_LIGHT}
		>
			<Flex
				direction={'column'}
				alignItems={'center'}
				padding={'2rem'}
				rounded={'lg'}
				width={'500px'}
				className={`border shadow-xl drop-shadow-xl`}
				gap={'1rem'}
			>
				<Flex alignItems={'center'} gap={'0.5rem'}>
					<Image src={LOGO} width={'48px'} className=' rounded-full mix-blend-multiply' />
					<Text color={Colors.PRIMARY_DARK} fontWeight={'bold'} fontSize={'xl'}>
						wpautomation.in
					</Text>
				</Flex>
				<Tabs
					width={'full'}
					isFitted
					variant='soft-rounded'
					size={'sm'}
					colorScheme='green'
					mt={'1rem'}
				>
					<TabList width={'200px'} margin={'auto'} bgColor={Colors.ACCENT_LIGHT} rounded={'full'}>
						<Tab>Login</Tab>
						<Tab>Signup</Tab>
					</TabList>
					<TabPanels>
						<TabPanel>
							<LoginTab />
						</TabPanel>
						<TabPanel>
							<SignupTab />
						</TabPanel>
					</TabPanels>
				</Tabs>
			</Flex>
		</Flex>
	);
}
