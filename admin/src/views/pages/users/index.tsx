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
import UsersService from '../../../services/users.service';
import { StoreNames, StoreState } from '../../../store';
import { setUsersList } from '../../../store/reducers/UsersReducer';
import { User } from '../../../store/types/UsersState';
import ConfirmationDialog, { ConfirmationDialogHandle } from '../../components/confirmation-alert';
import { NavbarSearchElement } from '../../components/navbar';
import ExtendSubscriptionDialog, {
	ExtendSubscriptionDialogHandle,
} from './components/ExtendSubscriptionDialog';
import ShareEmailInputDialog, { ShareEmailInputDialogHandle } from './components/ShareEmailInput';
import PaymentReminderAlert, {
	PaymentReminderDialogHandle,
} from './components/paymentReminderAlert';

const UsersPage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const toast = useToast();
	const [activeOnly, setActiveOnly] = useState(false);
	const [expiry, setExpiry] = useState('All');
	const {
		list,
		uiDetails: { isFetching },
	} = useSelector((state: StoreState) => state[StoreNames.USERS]);
	const { clientId } = useSelector((state: StoreState) => state[StoreNames.ADMIN]);
	const extendSubscriptionDialogRef = useRef<ExtendSubscriptionDialogHandle>(null);
	const confirmationAlertDialogRef = useRef<ConfirmationDialogHandle>(null);
	const paymentReminderDialogRef = useRef<PaymentReminderDialogHandle>(null);
	const emailInputDialogRef = useRef<ShareEmailInputDialogHandle>(null);

	const handleExportUsers = useCallback(() => {
		UsersService.getUsers({ csv: true });
	}, []);

	useEffect(() => {
		pushToNavbar({
			title: 'Users',
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
		filtered = filtered.filter((user) => user.isOnline);
	}

	if (expiry === 'Expired') {
		filtered = filtered.filter((user) => user.is_expired && user.subscription_expiry !== 'N/A');
	} else if (expiry === 'Active') {
		filtered = filtered.filter((user) => !user.is_expired && user.subscription_expiry !== 'N/A');
	}

	const handleAction = ({ id, phone, subscription_expiry, device_id }: User, action: string) => {
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
		UsersService.extendExpiry(user_id, months ?? 0).then(async () => {
			const users = await UsersService.getUsers();
			dispatch(setUsersList(users));
		});
	};

	const handleUserLogout = (id: string) => {
		UsersService.logoutUser(id).then(async () => {
			const users = await UsersService.getUsers();
			dispatch(setUsersList(users));
		});
	};

	const handleSendReminder = (id: string, message: string) => {
		UsersService.sendPaymentReminder(id, message).then(async () => {
			const users = await UsersService.getUsers();
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
								<Select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
									<option value={'All'} className='text-black'>
										All
									</option>
									<option value={'Expired'} className='text-black'>
										Expired
									</option>
									<option value={'Active'} className='text-black'>
										Active
									</option>
								</Select>
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
							filtered.map((user, index) => {
								return (
									<Tr key={index} color={theme === 'dark' ? 'white' : 'black'}>
										<Td>{index + 1}.</Td>
										<Td>{user.name}</Td>
										<Td>{user.username}</Td>
										<Td>{user.profile_name}</Td>
										<Td isNumeric>{user.phone}</Td>
										<Td>{user.type}</Td>
										<Td>{user.subscription_expiry}</Td>
										<Td>
											<Select value={''} onChange={(e) => handleAction(user, e.target.value)}>
												<option
													className='text-black bg-white dark:bg-gray-700 dark:text-white'
													value='select'
												>
													Select Action
												</option>
												<option
													className='text-black bg-white dark:bg-gray-700 dark:text-white'
													value='extend_expiry'
												>
													Extend Subscription
												</option>
												<option
													className='text-black bg-white dark:bg-gray-700 dark:text-white'
													value='payment_history'
												>
													Payment History
												</option>
												<option
													className='text-black bg-white dark:bg-gray-700 dark:text-white'
													value='payment_reminder'
												>
													Payment Reminder
												</option>
												{user.isGoogleSheetAvailable ? (
													<option
														className='text-black bg-white dark:bg-gray-700 dark:text-white'
														value='share-google-sheet'
													>
														Share Google Sheet
													</option>
												) : null}
												<option
													className='text-black bg-white dark:bg-gray-700 dark:text-white'
													value='logout'
												>
													Logout User
												</option>
											</Select>
										</Td>
										<Td>
											{user.isOnline ? (
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
				type='Logout User'
			/>
			<PaymentReminderAlert ref={paymentReminderDialogRef} onConfirm={handleSendReminder} />
			<ShareEmailInputDialog ref={emailInputDialogRef} />
		</Box>
	);
};

function LineSkeleton() {
	return <SkeletonText mt='4' noOfLines={1} spacing='4' skeletonHeight='4' rounded={'md'} />;
}

export default UsersPage;
