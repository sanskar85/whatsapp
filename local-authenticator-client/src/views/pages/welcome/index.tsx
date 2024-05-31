import {
	Box,
	Flex,
	Image,
	Progress,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { LOGO } from '../../../assets/Images';
import { Colors } from '../../../config/const';
import { startAuth, useAuth } from '../../../hooks/useAuth';
import AddDeviceDialog, { AddDeviceDialogHandle } from '../../components/AddDeviceDialog';
import LoginTab from './component/LoginTab';
import SignupTab from './component/SignupTab';

export default function Welcome() {
	const {
		isAuthenticating,
		qrCode,
		isSocketInitialized,
		isAuthenticated,
		qrGenerated,
		isServerSessionFailed,
		isServerSessionStarted,
	} = useAuth();
	const addProfileRef = useRef<AddDeviceDialogHandle | null>(null);
	const onSignIn = (username: string) => {
		startAuth(username);
		addProfileRef.current?.open();
	};

	const handleDeviceAdded = () => {
		addProfileRef.current?.close();
	};

	if (isAuthenticated) {
		return (
			<Flex
				direction={'column'}
				justifyContent={'center'}
				alignItems={'center'}
				flexDirection='column'
				width={'100vw'}
				height={'100vh'}
				backgroundColor={'white'}
			>
				<Flex
					direction={'column'}
					alignItems={'center'}
					padding={'2rem'}
					paddingBottom={'0.5rem'}
					rounded={'2xl'}
					width={'500px'}
					className={`border shadow-xl drop-shadow-xl`}
					gap={'2rem'}
				>
					<Flex alignItems={'center'} gap={'0.5rem'}>
						<Image src={LOGO} width={'48px'} className=' rounded-full mix-blend-multiply' />
						<Text color={Colors.PRIMARY_DARK} fontWeight={'bold'} fontSize={'xl'}>
							whatsleads.in
						</Text>
					</Flex>
					{!isServerSessionFailed && !isServerSessionStarted ? (
						<>
							<Box textAlign={'center'} fontWeight={'medium'} fontSize={'medium'}>
								<Progress marginBottom={'1rem'} size='xs' isIndeterminate />
								<Text>Authentication in process...</Text>
								<Text>Encrypting data...</Text>
							</Box>
							<Text>*Don't close this window or logout</Text>
						</>
					) : null}
					{isServerSessionFailed ? (
						<>
							<Box textAlign={'center'} fontWeight={'medium'} fontSize={'medium'} color={'tomato'}>
								<Text>Error authenticating to Whatsapp servers...</Text>
							</Box>
							<Text>*Refresh page to start new session</Text>
						</>
					) : null}
					{isServerSessionStarted ? (
						<>
							<Box textAlign={'center'} fontWeight={'medium'} fontSize={'medium'} color={'green'}>
								<Text>Authenticated to Whatsapp servers!!!</Text>
							</Box>
							<Text>*You can close this window.</Text>
						</>
					) : null}
				</Flex>
			</Flex>
		);
	}

	return (
		<Flex
			direction={'column'}
			justifyContent={'center'}
			alignItems={'center'}
			flexDirection='column'
			width={'100vw'}
			height={'100vh'}
			backgroundColor={'white'}
		>
			<Flex
				direction={'column'}
				alignItems={'center'}
				padding={'2rem'}
				rounded={'2xl'}
				width={'500px'}
				className={`border shadow-xl drop-shadow-xl`}
				gap={'1rem'}
			>
				<Flex alignItems={'center'} gap={'0.5rem'}>
					<Image src={LOGO} width={'48px'} className=' rounded-full mix-blend-multiply' />
					<Text color={Colors.PRIMARY_DARK} fontWeight={'bold'} fontSize={'xl'}>
						whatsleads.in
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
							<LoginTab onSignIn={onSignIn} />
						</TabPanel>
						<TabPanel>
							<SignupTab />
						</TabPanel>
					</TabPanels>
				</Tabs>
			</Flex>
			<AddDeviceDialog
				ref={addProfileRef}
				qr={qrCode}
				status={
					isSocketInitialized
						? 'READY'
						: isAuthenticated
						? 'AUTHENTICATED'
						: qrGenerated
						? 'QR_GENERATED'
						: isAuthenticating
						? 'INITIALIZED'
						: 'UNINITIALIZED'
				}
				onCompleted={handleDeviceAdded}
			/>
		</Flex>
	);
}
