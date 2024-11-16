import { CopyIcon } from '@chakra-ui/icons';
import {
	Button,
	FormControl,
	FormLabel,
	HStack,
	IconButton,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	useToast,
} from '@chakra-ui/react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import APIWebhookService from '../../../../services/api-webhook.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	addAPI,
	clearSelectedAPIDetails,
	setAPIName,
	setAPIError,
	setToken,
} from '../../../../store/reducers/APIWebhookReducer';

export type APIKeyDetailsInputDialogHandle = {
	close: () => void;
	open: () => void;
};

const APIKeyDetailsInputDialog = forwardRef<APIKeyDetailsInputDialogHandle>((_, ref) => {
	const dispatch = useDispatch();
	const toast = useToast();
	const [isOpen, setOpen] = useState(false);

	const {
		APIlist: list,
		APIdetails: details,
		APIerror: error,
		APIloading: loading,
		token,
	} = useSelector((state: StoreState) => state[StoreNames.API]);

	const onClose = () => {
		dispatch(clearSelectedAPIDetails());
		dispatch(setToken(''));
		setOpen(false);
	};

	useImperativeHandle(ref, () => ({
		close: () => {
			dispatch(clearSelectedAPIDetails());
			dispatch(setToken(''));
			setOpen(false);
		},
		open: () => {
			setOpen(true);
		},
	}));

	const handleAddAPI = async () => {
		if (!details.name) {
			dispatch(setAPIError('Please enter a file name'));
			return;
		}

		if (list.some((item) => item.name === details.name)) {
			dispatch(setAPIError('Name already exists'));
			return;
		}

		toast.promise(APIWebhookService.createApiKey(details.name), {
			loading: { title: 'Saving...' },
			error: { title: 'Error saving API Key' },
			success: (res) => {
				dispatch(addAPI(details));
				dispatch(setToken(res));
				return { title: 'API Key saved successfully' };
			},
		});
	};

	const copyToken = () => {
		toast({
			title: 'Token copied to clipboard',
			status: 'success',
		});
		navigator.clipboard.writeText(token);
	};

	if (!token) {
		return (
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				size={'2xl'}
				closeOnOverlayClick={!loading}
				scrollBehavior='inside'
			>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Add API Key</ModalHeader>
					<ModalBody pb={6}>
						<FormControl isInvalid={!!error} pt={'1rem'}>
							<FormLabel>Name</FormLabel>
							<Input
								placeholder='Key name'
								value={details.name ?? ''}
								onChange={(e) => dispatch(setAPIName(e.target.value))}
							/>
						</FormControl>
					</ModalBody>

					<ModalFooter>
						<HStack width={'full'} justifyContent={'flex-end'}>
							<Button onClick={onClose} colorScheme='red' isDisabled={loading}>
								Cancel
							</Button>
							<Button colorScheme='whatsapp' mr={3} onClick={handleAddAPI} isLoading={loading}>
								Save
							</Button>
						</HStack>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	} else {
		return (
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				size={'2xl'}
				closeOnOverlayClick={!loading}
				scrollBehavior='inside'
			>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Token</ModalHeader>
					<ModalBody pb={6}>
						<FormControl isInvalid={!!error} pt={'1rem'} display={'flex'} gap={'1'}>
							<Input value={token} isReadOnly />
							<IconButton aria-label='copy' icon={<CopyIcon />} onClick={copyToken} />
						</FormControl>
					</ModalBody>

					<ModalFooter>
						<HStack width={'full'} justifyContent={'flex-end'}>
							<Button onClick={onClose} colorScheme='red' isDisabled={loading}>
								Close
							</Button>
						</HStack>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}
});

export default APIKeyDetailsInputDialog;
