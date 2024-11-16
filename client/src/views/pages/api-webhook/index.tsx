import {
	Box,
	Button,
	Checkbox,
	HStack,
	Icon,
	IconButton,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	useToast,
} from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { BiCode, BiCodeAlt, BiGlobe } from 'react-icons/bi';
import { TbTrash } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { NAVIGATION } from '../../../config/const';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import APIWebhookService from '../../../services/api-webhook.service';
import { StoreNames, StoreState } from '../../../store';
import {
	addToSelectedAPIList,
	addToSelectedListWebhook,
	deleteAPI,
	deleteWebhook,
	removeFromSelectedList,
	removeFromSelectedListWebhook,
	setToken,
} from '../../../store/reducers/APIWebhookReducer';
import DeleteAlert, { DeleteAlertHandle } from '../../components/delete-alert';
import APIKeyDetailsInputDialog, {
	APIKeyDetailsInputDialogHandle,
} from './components/add-api-input-dialog';
import WebhookDetailsInputDialog, {
	WebhookDetailsInputDialogHandle,
} from './components/add-webhook-input-dialog';

const APIWebhook = () => {
	const dispatch = useDispatch();
	const theme = useTheme();
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);
	const APIInputDialogRef = useRef<APIKeyDetailsInputDialogHandle>(null);
	const WebhookInputDialogRef = useRef<WebhookDetailsInputDialogHandle>(null);
	const toast = useToast();

	const { APIlist, APIselectedList, webhookList, webhookSelectedList } = useSelector(
		(store: StoreState) => store[StoreNames.API]
	);

	useEffect(() => {
		pushToNavbar({
			title: 'API Keys and webhooks',
			icon: BiCode,
			link: NAVIGATION.API,
			actions: (
				<HStack>
					<IconButton
						isDisabled={APIselectedList.length === 0 && webhookSelectedList.length === 0}
						aria-label='delete API Key'
						icon={<TbTrash />}
						colorScheme='red'
						onClick={() => deleteAlertRef.current?.open()}
						size={'sm'}
					/>
				</HStack>
			),
		});
		return () => {
			popFromNavbar();
		};
	}, [dispatch, APIselectedList.length, webhookSelectedList.length]);

	const handleDelete = () => {
		if (APIselectedList.length > 0) {
			const APIPromises = APIselectedList.map((id) => APIWebhookService.deleteApiKey(id));
			toast.promise(Promise.all(APIPromises), {
				success: () => {
					dispatch(deleteAPI(APIselectedList));
					return { title: 'API key deleted successfully' };
				},
				error: () => {
					return { title: 'Failed to delete API key' };
				},
				loading: { title: 'Deleting API key' },
			});
		}

		if (webhookSelectedList.length > 0) {
			const webhookPromises = webhookSelectedList.map((id) => APIWebhookService.deleteWebhook(id));
			toast.promise(Promise.all(webhookPromises), {
				success: () => {
					dispatch(deleteWebhook(webhookSelectedList));
					return { title: 'Webhook deleted successfully' };
				},
				error: () => {
					return { title: 'Failed to delete Webhook' };
				},
				loading: { title: 'Deleting Webhook' },
			});
		}
	};

	const regenerateApiKey = (id: string) => {
		toast.promise(APIWebhookService.regenerateAPIKey(id), {
			success: (res) => {
				dispatch(setToken(res));
				APIInputDialogRef.current?.open();
				return { title: 'API key regenerated successfully' };
			},
			error: () => {
				return { title: 'Failed to regenerate API key' };
			},
			loading: { title: 'Regenerating API key' },
		});
	};

	const validateWebhook = (id: string) => {
		toast.promise(APIWebhookService.validateWebhook(id), {
			success: () => {
				return { title: 'Validated successfully' };
			},
			error: () => {
				return { title: 'Failed to Validate Webhook' };
			},
			loading: { title: 'Validating Webhook' },
		});
	};

	return (
		<Box py={'1rem'} textColor={theme === 'dark' ? 'white' : 'black'}>
			<Box display={'flex'} fontSize={'1.5rem'} px={'1rem'}>
				<Box flex={1}>API Keys</Box>
				<Button
					leftIcon={<Icon as={BiCodeAlt} height={5} width={5} />}
					colorScheme={'green'}
					size={'sm'}
					onClick={() => APIInputDialogRef.current?.open()}
				>
					ADD API key
				</Button>
			</Box>
			<TableContainer py={'0.5rem'}>
				<Table>
					<Thead>
						<Tr>
							<Th width={'5%'}>Sl no</Th>
							<Th width={'30%'}>Name</Th>
							<Th width={'30%'}>CreatedAt</Th>
							<Th width={'30%'}>Regenerate</Th>
						</Tr>
					</Thead>
					<Tbody>
						{APIlist.map((key, index) => (
							<Tr key={index}>
								<Td>
									<Checkbox
										colorScheme='green'
										mr={2}
										isChecked={APIselectedList.includes(key.id)}
										onChange={(e) => {
											if (e.target.checked) {
												dispatch(addToSelectedAPIList(key.id));
											} else {
												dispatch(removeFromSelectedList(key.id));
											}
										}}
									/>
									{index + 1}.
								</Td>
								<Td>
									<Box>{key.name}</Box>
								</Td>
								<Td>{key.createdAt}</Td>
								<Td>
									<Button
										size={'sm'}
										colorScheme={'green'}
										onClick={() => regenerateApiKey(key.id)}
									>
										Regenerate
									</Button>
								</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			</TableContainer>
			<Box display={'flex'} fontSize={'1.5rem'} px={'1rem'}>
				<Box flex={1}>Webhooks</Box>
				<Button
					leftIcon={<Icon as={BiGlobe} height={5} width={5} />}
					colorScheme={'green'}
					size={'sm'}
					onClick={() => WebhookInputDialogRef.current?.open()}
				>
					ADD Webhook
				</Button>
			</Box>
			<TableContainer pt={'0.5rem'}>
				<Table>
					<Thead>
						<Tr>
							<Th width={'5%'}>Sl no</Th>
							<Th width={'30%'}>Name</Th>
							<Th width={'30%'}>URL</Th>
							<Th width={'30%'}>CreatedAt</Th>
							<Th width={'5%'}>Validate</Th>
						</Tr>
					</Thead>
					<Tbody>
						{webhookList.map((key, index) => (
							<Tr key={index}>
								<Td>
									<Checkbox
										colorScheme='green'
										mr={2}
										isChecked={webhookSelectedList.includes(key.id)}
										onChange={(e) => {
											if (e.target.checked) {
												dispatch(addToSelectedListWebhook(key.id));
											} else {
												dispatch(removeFromSelectedListWebhook(key.id));
											}
										}}
									/>
									{index + 1}.
								</Td>
								<Td>
									<Box>{key.name}</Box>
								</Td>
								<Td>
									<Box>{key.url}</Box>
								</Td>
								<Td>{key.createdAt}</Td>
								<Td>
									<Button size={'sm'} colorScheme={'green'} onClick={() => validateWebhook(key.id)}>
										Validate
									</Button>
								</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			</TableContainer>
			<DeleteAlert type={'API & Webhook'} ref={deleteAlertRef} onConfirm={handleDelete} />
			<APIKeyDetailsInputDialog ref={APIInputDialogRef} />
			<WebhookDetailsInputDialog ref={WebhookInputDialogRef} />
		</Box>
	);
};

export default APIWebhook;
