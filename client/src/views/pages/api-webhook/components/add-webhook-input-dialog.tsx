import {
	Button,
	FormControl,
	FormLabel,
	HStack,
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
	addWebhook,
	clearSelectedWebhookDetails,
	setWebhookError,
	setWebhookName,
	setWebhookURL,
} from '../../../../store/reducers/APIWebhookReducer';

export type WebhookDetailsInputDialogHandle = {
	close: () => void;
	open: () => void;
};

const WebhookDetailsInputDialog = forwardRef<WebhookDetailsInputDialogHandle>((_, ref) => {
	const dispatch = useDispatch();
	const toast = useToast();
	const [isOpen, setOpen] = useState(false);

	const { webhookList, webhookDetails, webhookError, webhookLoading } = useSelector(
		(state: StoreState) => state[StoreNames.API]
	);

	const onClose = () => {
		dispatch(clearSelectedWebhookDetails());
		setOpen(false);
	};

	useImperativeHandle(ref, () => ({
		close: () => {
			dispatch(clearSelectedWebhookDetails());
			setOpen(false);
		},
		open: () => {
			setOpen(true);
		},
	}));

	const handleAddWebhook = async () => {
		if (!webhookDetails.name) {
			dispatch(setWebhookError('Please enter a file name'));
			return;
		}

		if (webhookList.some((item) => item.name === webhookDetails.name)) {
			dispatch(setWebhookError('Name already exists'));
			return;
		}

		toast.promise(APIWebhookService.createWebhook(webhookDetails.name, webhookDetails.url), {
			loading: { title: 'Saving...' },
			error: { title: 'Error saving Webhook' },
			success: (res) => {
				dispatch(addWebhook(res));
				onClose();
				return { title: 'Webhook saved successfully' };
			},
		});
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size={'2xl'}
			closeOnOverlayClick={!webhookLoading}
			scrollBehavior='inside'
		>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Add Webhook</ModalHeader>
				<ModalBody pb={6}>
					<FormControl isInvalid={!!webhookError} pt={'1rem'}>
						<FormLabel>Name</FormLabel>
						<Input
							placeholder='Webhook name'
							value={webhookDetails.name ?? ''}
							onChange={(e) => dispatch(setWebhookName(e.target.value))}
						/>
					</FormControl>
					<FormControl isInvalid={!!webhookError} pt={'1rem'}>
						<FormLabel>URL</FormLabel>
						<Input
							placeholder='Webhook URL'
							value={webhookDetails.url ?? ''}
							onChange={(e) => dispatch(setWebhookURL(e.target.value))}
						/>
					</FormControl>
				</ModalBody>

				<ModalFooter>
					<HStack width={'full'} justifyContent={'flex-end'}>
						<Button onClick={onClose} colorScheme='red' isDisabled={webhookLoading}>
							Cancel
						</Button>
						<Button
							colorScheme='whatsapp'
							mr={3}
							onClick={handleAddWebhook}
							isLoading={webhookLoading}
						>
							Save
						</Button>
					</HStack>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
});

export default WebhookDetailsInputDialog;
