import {
	Alert,
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertIcon,
	Button,
	Link,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StoreNames, StoreState } from '../../../store';
import { setSettingsOpen } from '../../../store/reducers/UserDetailsReducers';

const SubscriptionAlert = () => {
	const [isOpen, setIsOpen] = useState(false);
	const onClose = () => setIsOpen(false);
	const cancelRef = React.useRef<HTMLButtonElement>(null);

	const { canSendMessage, isWhatsappReady, data_loaded } = useSelector(
		(state: StoreState) => state[StoreNames.USER]
	);

	useEffect(() => {
		setIsOpen(!canSendMessage && data_loaded && isWhatsappReady);
	}, [canSendMessage, data_loaded, isWhatsappReady]);

	return (
		<AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
			<AlertDialogOverlay>
				<AlertDialogContent>
					<AlertDialogHeader fontSize='lg' fontWeight='bold'>
						Subscription Alert
					</AlertDialogHeader>

					<AlertDialogBody>Please Subscribe to use this feature</AlertDialogBody>

					<AlertDialogFooter>
						<Button
							ref={cancelRef}
							onClick={onClose}
							colorScheme='gray'
							className='focus:outline-none focus:border-none active:outline-none active:border-none'
							outline={'none'}
							border={'none'}
						>
							Close
						</Button>
						<Button
							className='focus:outline-none focus:border-none active:outline-none active:border-none'
							outline={'none'}
							border={'none'}
							colorScheme='yellow'
							onClick={() => {
								window.open('https://whatsleads.in/pricing', '_black');
								onClose();
							}}
							ml={3}
							textColor={'white'}
						>
							Subscribe
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogOverlay>
		</AlertDialog>
	);
};

export function SubscriptionPopup() {
	const { canSendMessage, isWhatsappReady } = useSelector(
		(state: StoreState) => state[StoreNames.USER]
	);
	return (
		<Alert hidden={canSendMessage || !isWhatsappReady} status='warning' rounded={'md'} my={2}>
			<AlertIcon />
			Seems this feature needs a subscription
			<Link
				flexGrow={1}
				display={'inline-flex'}
				justifyContent={'flex-end'}
				href={'https://whatsleads.in/pricing'}
				target='_blank'
				_hover={{ textColor: 'black' }}
			>
				Subscribe Now
			</Link>
		</Alert>
	);
}

export function AddDevicePopup() {
	const dispatch = useDispatch();
	const { isWhatsappReady } = useSelector((state: StoreState) => state[StoreNames.USER]);

	const handleClick = () => {
		dispatch(setSettingsOpen(true));
	};

	return (
		<Alert hidden={isWhatsappReady} status='warning' rounded={'md'} my={2} color={'red.500'}>
			<AlertIcon />
			Seems this feature needs a whatsapp linked device.
			<Link
				flexGrow={1}
				display={'inline-flex'}
				justifyContent={'flex-end'}
				_hover={{ textColor: 'green' }}
				onClick={handleClick}
			>
				Connect to Whatsapp
			</Link>
		</Alert>
	);
}

export default SubscriptionAlert;
