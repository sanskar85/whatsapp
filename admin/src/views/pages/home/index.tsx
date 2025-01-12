import { Box, Flex, Image, Progress, Text, useBoolean } from '@chakra-ui/react';
import Lottie from 'lottie-react';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, useNavigate, useOutlet } from 'react-router-dom';
import { LOGO } from '../../../assets/Images';
import { LOTTIE_LOADER } from '../../../assets/Lottie';
import { DATA_LOADED_DELAY, NAVIGATION } from '../../../config/const';
import { useAuth } from '../../../hooks/useAuth';
import { useNetwork } from '../../../hooks/useNetwork';
import '../../../index.css';
import DeviceService from '../../../services/devices.service';
import PaymentService from '../../../services/payment.service';
import UsersService from '../../../services/users.service';
import { setDeviceList } from '../../../store/reducers/DeviceReducer';
import { setRecordsList } from '../../../store/reducers/PaymentReducers';
import { setUsersList } from '../../../store/reducers/UsersReducer';
import Navbar from '../../components/navbar';
import NavigationDrawer from '../../components/navigation-drawer';

export default function Home() {
	const navigate = useNavigate();
	const status = useNetwork();
	const outlet = useOutlet();
	const { isAuthenticated, isValidating } = useAuth();
	const dispatch = useDispatch();

	const [dataLoaded, setDataLoaded] = useBoolean(false);

	useEffect(() => {
		if (status === 'NO-NETWORK') {
			navigate(NAVIGATION.NETWORK_ERROR);
		}
	}, [status, navigate]);

	const fetchAllDetails = useCallback(async () => {
		try {
			const promises = [
				UsersService.getUsers(),
				PaymentService.getPaymentRecords(),
				DeviceService.getDevices(),
				addDelay(DATA_LOADED_DELAY),
			];

			const results = await Promise.all(promises);

			if (results[0]) {
				dispatch(setUsersList(results[0]));
			}

			if (results[1]) {
				dispatch(setRecordsList(results[1]));
			}

			if (results[2]) {
				dispatch(setDeviceList(results[2]));
			}

			console.log(results[2])

			setDataLoaded.on();
		} catch (e) {
			navigate(NAVIGATION.LOGIN);
			return;
		}
	}, [dispatch, navigate, setDataLoaded]);

	useEffect(() => {
		if (dataLoaded) {
			return;
		}

		setDataLoaded.off();
		fetchAllDetails();
	}, [fetchAllDetails, setDataLoaded, dataLoaded]);

	if (isValidating) {
		return (
			<Flex
				justifyContent={'center'}
				alignItems={'center'}
				direction={'column'}
				gap={'3rem'}
				width={'full'}
			>
				<Flex justifyContent={'center'} alignItems={'center'} width={'full'} gap={'1rem'}>
					<Image src={LOGO} width={'48px'} className='shadow-lg rounded-full' />
					<Text className='text-black dark:text-white' fontSize={'lg'} fontWeight='bold'>
						WhatsLeads
					</Text>
				</Flex>
				<Progress size='xs' isIndeterminate width={'30%'} rounded={'lg'} />
			</Flex>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to={NAVIGATION.LOGIN} />;
	}

	return (
		<Box width='full' className='custom-scrollbar'>
			<NavigationDrawer />
			<Navbar />
			<Box paddingLeft={'70px'} paddingTop={'70px'} overflowX={'hidden'} className='min-h-screen'>
				{outlet ? outlet : <Navigate to={NAVIGATION.DASHBOARD} />}
				<Loading isLoaded={dataLoaded} />
			</Box>
		</Box>
	);
}

function Loading({ isLoaded }: { isLoaded: boolean }) {
	if (isLoaded) {
		return null;
	}
	return (
		<Flex
			justifyContent={'center'}
			alignItems={'center'}
			direction={'column'}
			position={'fixed'}
			gap={'3rem'}
			height={'100vh'}
			width={'100vw'}
			left={0}
			top={0}
			zIndex={99}
			userSelect={'none'}
			className='bg-black/50'
		>
			<Flex
				direction={'column'}
				justifyContent={'center'}
				alignItems={'center'}
				bg={'#f2f2f2'}
				paddingX={'4rem'}
				paddingTop={'4rem'}
				paddingBottom={'2rem'}
				aspectRatio={'1/1'}
				rounded={'lg'}
			>
				<Lottie animationData={LOTTIE_LOADER} loop={true} />
				<Text className='text-black ' fontSize={'lg'} fontWeight='bold'>
					WhatsLeads
				</Text>
				<Text mt={'1rem'} className='text-black ' fontSize={'xs'}>
					Data synchronization in progress.
				</Text>
				<Text className='text-black ' fontSize={'xs'}>
					It may take longer to complete.
				</Text>
			</Flex>
		</Flex>
	);
}

function addDelay(delay: number) {
	return new Promise((resolve: (value?: null) => void) => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
}
