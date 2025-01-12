import {
	Box,
	Button,
	HStack,
	Icon,
	Select,
	SkeletonText,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	useToast,
} from '@chakra-ui/react';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MdGroups3 } from 'react-icons/md';
import { TbDatabaseExport } from 'react-icons/tb';
import { VscLayersActive } from 'react-icons/vsc';

import { useDispatch, useSelector } from 'react-redux';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { NAVIGATION } from '../../../config/const';
import useFilteredList from '../../../hooks/useFilteredList';
import { popFromNavbar, pushToNavbar, setNavbarSearchText } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import DeviceService from '../../../services/devices.service';
import { StoreNames, StoreState } from '../../../store';
import { setUsersList } from '../../../store/reducers/UsersReducer';
import { Device } from '../../../store/types/DevicesState';
import ConfirmationDialog, { ConfirmationDialogHandle } from '../../components/confirmation-alert';
import { NavbarSearchElement } from '../../components/navbar';
import ExtendSubscriptionDialog, {
	ExtendSubscriptionDialogHandle,
} from './components/ExtendSubscriptionDialog';
import ShareEmailInputDialog, { ShareEmailInputDialogHandle } from './components/ShareEmailInput';
import PaymentReminderAlert, {
	PaymentReminderDialogHandle,
} from './components/paymentReminderAlert';

const DevicesPage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const toast = useToast();
	const [activeOnly, setActiveOnly] = useState(false);
	const {
		list,
		uiDetails: { isFetching },
	} = useSelector((state: StoreState) => state[StoreNames.DEVICES]);
	const { clientId } = useSelector((state: StoreState) => state[StoreNames.ADMIN]);
	const extendSubscriptionDialogRef = useRef<ExtendSubscriptionDialogHandle>(null);
	const confirmationAlertDialogRef = useRef<ConfirmationDialogHandle>(null);
	const paymentReminderDialogRef = useRef<PaymentReminderDialogHandle>(null);
	const emailInputDialogRef = useRef<ShareEmailInputDialogHandle>(null);

	const handleExportUsers = useCallback(() => {
		DeviceService.getDevices({ csv: true });
	}, []);

	useEffect(() => {
		pushToNavbar({
			title: 'Devices',
			icon: MdGroups3,
			actions: (
				<HStack>
					<NavbarSearchElement />
					<Button
						leftIcon={<Icon as={TbDatabaseExport} height={5} width={5} />}
						colorScheme={'blue'}
						size={'sm'}
						onClick={handleExportUsers}
					>
						EXPORT
					</Button>
				</HStack>
			),
		});
		return () => {
			popFromNavbar();
		};
	}, [handleExportUsers]);

	let filtered = useFilteredList(list, { name: 1, phone: 1 });

	if (activeOnly) {
		filtered = filtered.filter((device) => device.isOnline);
	}

	const handleAction = ({ id, phone, subscription_expiry, device_id }: Device, action: string) => {
		if (action === 'extend_expiry') {
			if (!device_id) {
				toast({
					title: 'Error',
					description: 'Device ID not found',
					status: 'error',
					duration: 3000,
					isClosable: true,
				});
				return;
			}
			return extendSubscriptionDialogRef.current?.open(device_id, subscription_expiry);
		}
		if (action === 'payment_history') {
			setNavbarSearchText(phone);
			return navigate({
				pathname: NAVIGATION.PAYMENT_HISTORY,
				search: createSearchParams({ phone }).toString(),
			});
		}
		if (action === 'share-google-sheet') {
			return emailInputDialogRef.current?.open(id);
		}
		if (action === 'logout') {
			return confirmationAlertDialogRef.current?.open(id);
		}
		if (action === 'payment_reminder') {
			if (!clientId) {
				toast({
					title: 'Error',
					description: 'Client ID not found',
					status: 'error',
					duration: 3000,
					isClosable: true,
				});
				return;
			}
			return paymentReminderDialogRef.current?.open(id);
		}
	};
	const extendSubscription = (user_id: string, months: string) => {
		DeviceService.extendExpiry(user_id, months ?? 0).then(async () => {
			const users = await DeviceService.getDevices();
			dispatch(setUsersList(users));
		});
	};

	const handleUserLogout = (id: string) => {
		DeviceService.logoutDevice(id).then(async () => {
			const users = await DeviceService.getDevices();
			dispatch(setUsersList(users));
		});
	};

	const handleSendReminder = (id: string, message: string) => {
		DeviceService.sendPaymentReminder(id, message).then(async () => {
			const users = await DeviceService.getDevices();
			dispatch(setUsersList(users));
		});
	};

	const handleActiveToggle = () => {
		setActiveOnly((prev) => !prev);
	};

	return (
		<Box>
			<TableContainer>
				<Table>
					<Thead>
						<Tr>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								sl no
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'15%'}>
								Name
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'15%'}>
								Email
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'15%'}>
								Whatsapp Public Name
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'15%'} isNumeric>
								Phone
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'10%'}>
								Type
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'10%'}>
								Expiry
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'20%'}>
								Actions
							</Th>
							<Th
								color={theme === 'dark' ? 'whitesmoke' : 'gray'}
								width={'5%'}
								onClick={handleActiveToggle}
							>
								<VscLayersActive size={'1.25rem'} />
							</Th>
						</Tr>
					</Thead>
					<Tbody>
						{isFetching && list.length === 0 ? (
							<Tr color={theme === 'dark' ? 'white' : 'black'}>
								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<LineSkeleton />
								</Td>
							</Tr>
						) : (
							filtered.map((device, index) => {
								return (
									<Tr key={index} color={theme === 'dark' ? 'white' : 'black'}>
										<Td>{index + 1}.</Td>
										<Td>{device.name}</Td>
										<Td>{device.username}</Td>
										<Td>{device.profile_name}</Td>
										<Td isNumeric>{device.phone}</Td>
										<Td>{device.type}</Td>
										<Td>{device.subscription_expiry}</Td>
										<Td>
											<Select value={''} onChange={(e) => handleAction(device, e.target.value)}>
												<option
													className='bg-white text-black dark:bg-gray-700 dark:text-white'
													value='select'
												>
													Select Action
												</option>
												<option
													className='bg-white text-black dark:bg-gray-700 dark:text-white'
													value='extend_expiry'
												>
													Extend Subscription
												</option>
												<option
													className='bg-white text-black dark:bg-gray-700 dark:text-white'
													value='payment_history'
												>
													Payment History
												</option>
												<option
													className='bg-white text-black dark:bg-gray-700 dark:text-white'
													value='payment_reminder'
												>
													Payment Reminder
												</option>
												{device.isGoogleSheetAvailable ? (
													<option
														className='bg-white text-black dark:bg-gray-700 dark:text-white'
														value='share-google-sheet'
													>
														Share Google Sheet
													</option>
												) : null}
												<option
													className='bg-white text-black dark:bg-gray-700 dark:text-white'
													value='logout'
												>
													Logout Device
												</option>
											</Select>
										</Td>
										<Td>
											{device.isOnline ? (
												<Box className='online-indicator'>
													<Box as='span' className='blink'></Box>
												</Box>
											) : (
												<Box className='offline'></Box>
											)}
										</Td>
									</Tr>
								);
							})
						)}
					</Tbody>
				</Table>
			</TableContainer>
			<ExtendSubscriptionDialog ref={extendSubscriptionDialogRef} onConfirm={extendSubscription} />
			<ConfirmationDialog
				ref={confirmationAlertDialogRef}
				onConfirm={handleUserLogout}
				type='Logout Device'
			/>
			<PaymentReminderAlert ref={paymentReminderDialogRef} onConfirm={handleSendReminder} />
			<ShareEmailInputDialog ref={emailInputDialogRef} />
		</Box>
	);
};

function LineSkeleton() {
	return <SkeletonText mt='4' noOfLines={1} spacing='4' skeletonHeight='4' rounded={'md'} />;
}

export default DevicesPage;
