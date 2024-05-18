import { Box, Flex, Image, Progress, Text, useToast } from '@chakra-ui/react';
import Lottie from 'lottie-react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useOutlet } from 'react-router-dom';
import { LOGO } from '../../../assets/Images';
import { LOTTIE_LOADER } from '../../../assets/Lottie';
import { DATA_LOADED_DELAY, NAVIGATION } from '../../../config/const';
import '../../../index.css';
import AttachmentService from '../../../services/attachment.service';
import AuthService from '../../../services/auth.service';
import BotService from '../../../services/bot.service';
import ContactCardService from '../../../services/contact-card.service';
import GroupService from '../../../services/group.service';
import LabelService from '../../../services/label.service';
import MessageService from '../../../services/message.service';
import ShortenerService from '../../../services/shortener.service';
import UploadsService from '../../../services/uploads.service';
import { StoreNames, StoreState, store } from '../../../store';
import { setAttachments } from '../../../store/reducers/AttachmentReducers';
import { setBots } from '../../../store/reducers/BotReducers';
import { setCSVFileList } from '../../../store/reducers/CSVFileReducers';
import { setContactList } from '../../../store/reducers/ContactCardReducers';
import { setLinksList } from '../../../store/reducers/LinkShortnerReducers';
import { setMergedGroupList } from '../../../store/reducers/MergeGroupReducer';
import { setAllSchedulers } from '../../../store/reducers/SchedulerReducer';
import { setUserDetails } from '../../../store/reducers/UserDetailsReducers';
import Navbar from '../../components/navbar';
import NavigationDrawer from '../../components/navigation-drawer';

export default function Home() {
	const outlet = useOutlet();
	const [isAuthenticated, setAuthenticated] = useState(false);
	const [isAuthenticating, setAuthenticating] = useState(true);
	const toast = useToast();
	const dispatch = useDispatch();

	const { data_loaded } = useSelector((state: StoreState) => state[StoreNames.USER]);

	const fetchUserDetails = useCallback(async () => {
		try {
			toast.promise(GroupService.listGroups(), {
				success: (res) => {
					store.dispatch(
						setUserDetails({
							groups: res,
						})
					);
					return {
						title: 'Groups loaded.',
						duration: 3000,
					};
				},
				error: {
					title: 'Error loading groups.',
					duration: 3000,
				},
				loading: {
					title: 'Loading groups.',
				},
			});

			const promises = [
				addDelay(DATA_LOADED_DELAY),
				ContactCardService.ListContactCards(),
				AttachmentService.getAttachments(),
				UploadsService.listCSV(),
				LabelService.listLabels(),
				BotService.listBots(),
				ShortenerService.listAll(),
				GroupService.mergedGroups(),
				MessageService.getScheduledMessages(),
			];

			const results = await Promise.all(promises);

			dispatch(
				setUserDetails({
					labels: results[4],
					contactsCount: null,
					data_loaded: true,
				})
			);
			dispatch(setContactList(results[1]));
			dispatch(setAttachments(results[2]));
			dispatch(setCSVFileList(results[3]));
			dispatch(setBots(results[5]));
			dispatch(setLinksList(results[6]));
			dispatch(setMergedGroupList(results[7]));
			dispatch(setAllSchedulers(results[8]));

			AuthService.validateClientID().then((res) => {
				if (res) {
					dispatch(
						setUserDetails({
							canSendMessage: res.canSendMessage,
							isSubscribed: res.isSubscribed,
						})
					);
				}
			});
		} catch (e) {
			return;
		}
	}, [dispatch, toast]);

	useEffect(() => {
		AuthService.isAuthenticated()
			.then(setAuthenticated)
			.finally(() => setAuthenticating(false));
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			fetchUserDetails();
		}
	}, [fetchUserDetails, isAuthenticated]);

	if (isAuthenticating) {
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
		return <Navigate to={NAVIGATION.WELCOME} />;
	}

	return (
		<Box width='full' className='custom-scrollbar'>
			<NavigationDrawer />
			<Navbar />
			<Box paddingLeft={'70px'} paddingTop={'70px'} overflowX={'hidden'} className='min-h-screen'>
				{outlet ? outlet : <Navigate to={NAVIGATION.CONTACT} />}
				<Loading isLoaded={data_loaded} />
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
