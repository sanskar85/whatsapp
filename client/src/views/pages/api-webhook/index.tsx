import {
	Box,
	Button,
	Checkbox,
	HStack,
	Icon,
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
import { BiCode, BiCodeAlt } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import { NAVIGATION } from '../../../config/const';
import useFilteredList from '../../../hooks/useFilteredList';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import APIWebhookService from '../../../services/api-webhook.service';
import { StoreNames, StoreState } from '../../../store';
import {
	addToSelectedList,
	deleteAPI,
	removeFromSelectedList,
	selectAllList,
	setToken,
} from '../../../store/reducers/APIWebhookReducer';
import DeleteAlert, { DeleteAlertHandle } from '../../components/delete-alert';
import { NavbarDeleteElement, NavbarSearchElement } from '../../components/navbar';
import APIKeyDetailsInputDialog, {
	APIKeyDetailsInputDialogHandle,
} from './components/add-api-input-dialog';

const APIWebhook = () => {
	const dispatch = useDispatch();
	const theme = useTheme();
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);
	const drawerRef = useRef<APIKeyDetailsInputDialogHandle>(null);
	const toast = useToast();

	const { list, selectedList } = useSelector((store: StoreState) => store[StoreNames.API]);

	const filtered = useFilteredList(list, { name: 1 });

	useEffect(() => {
		pushToNavbar({
			title: 'API Keys',
			icon: BiCode,
			link: NAVIGATION.API,
			actions: (
				<HStack>
					<NavbarSearchElement />
					<Button
						leftIcon={<Icon as={BiCodeAlt} height={5} width={5} />}
						colorScheme={'green'}
						size={'sm'}
						onClick={() => drawerRef.current?.open()}
					>
						ADD
					</Button>
					<NavbarDeleteElement
						isDisabled={selectedList.length === 0}
						onClick={() => deleteAlertRef.current?.open('')}
					/>
					<Button colorScheme='blue' size={'sm'} onClick={() => dispatch(selectAllList())}>
						Select All
					</Button>
				</HStack>
			),
		});
		return () => {
			popFromNavbar();
		};
	}, [dispatch, selectedList.length]);

	const handleDeleteAPIkey = () => {
		const promises = selectedList.map((id) => APIWebhookService.deleteApiKey(id));
		toast.promise(Promise.all(promises), {
			success: () => {
				dispatch(deleteAPI(selectedList));
				return { title: 'API key deleted successfully' };
			},
			error: () => {
				return { title: 'Failed to delete API key' };
			},
			loading: { title: 'Deleting API key' },
		});
	};

	const regenerateApiKey = (id: string) => {
		toast.promise(APIWebhookService.regenerateAPIKey(id), {
			success: (res) => {
				dispatch(setToken(res));
				drawerRef.current?.open();
				return { title: 'API key regenerated successfully' };
			},
			error: () => {
				return { title: 'Failed to regenerate API key' };
			},
			loading: { title: 'Regenerating API key' },
		});
	};

	return (
		<Box py={'1rem'} textColor={theme === 'dark' ? 'white' : 'black'}>
			<TableContainer pt={'0.5rem'}>
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
						{filtered.map((key, index) => (
							<Tr key={index}>
								<Td>
									<Checkbox
										colorScheme='green'
										mr={2}
										isChecked={selectedList.includes(key.id)}
										onChange={(e) => {
											if (e.target.checked) {
												dispatch(addToSelectedList(key.id));
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
			<DeleteAlert type={'API'} ref={deleteAlertRef} onConfirm={handleDeleteAPIkey} />
			<APIKeyDetailsInputDialog ref={drawerRef} />
		</Box>
	);
};

export default APIWebhook;
