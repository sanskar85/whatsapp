import { DownloadIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerHeader,
	DrawerOverlay,
	Flex,
	HStack,
	IconButton,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	VStack,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { startAuth, useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import AuthService from '../../../services/auth.service';
import PaymentService from '../../../services/payment.service';
import { StoreNames, StoreState } from '../../../store';
import AddDeviceDialog, { AddDeviceDialogHandle } from './components/AddDeviceDialog';
import ChangePassword, { ChangePasswordHandle } from './components/ChangePassword';

type SettingsProps = {
	isOpen: boolean;
	onClose: () => void;
};

type Payment = {
	type: 'payment';
	id: string;
	date: string;
	amount: number;
};

type Subscription = {
	type: 'subscription';
	id: string;
	plan: string;
	isActive: boolean;
	isPaused: boolean;
};

export default function Settings({ isOpen, onClose }: SettingsProps) {
	const theme = useTheme();
	const addProfileRef = useRef<AddDeviceDialogHandle | null>(null);
	const changePasswordRef = useRef<ChangePasswordHandle | null>(null);

	const { isAuthenticating, qrCode, isSocketInitialized, isAuthenticated, qrGenerated } = useAuth();

	const { isSubscribed, userType } = useSelector((state: StoreState) => state[StoreNames.USER]);

	const [phoneState, setPhoneAuthenticated] = useState<{
		session_expires_at: string;
		isWhatsappReady: boolean;
		status: string;
		phone_number: string;
		name: string;
	} | null>(null);

	const [PAYMENT_RECORDS, setPaymentRecords] = useState<(Payment | Subscription)[]>([]);

	useEffect(() => {
		AuthService.validateClientID().then(setPhoneAuthenticated);
		PaymentService.paymentRecords().then(setPaymentRecords);
	}, []);

	const handleLinkWhatsapp = () => {
		startAuth();
		addProfileRef.current?.open();
	};

	const handleDeviceAdded = () => {
		AuthService.validateClientID().then((res) => {
			if (res) {
				setPhoneAuthenticated(res);
				window.location.reload();
			}
		});
	};

	const logoutWhatsapp = async () => {
		await AuthService.logoutWhatsapp();
		AuthService.validateClientID().then((res) => {
			if (res) {
				setPhoneAuthenticated(res);
				window.location.reload();
			}
		});
	};

	return (
		<Drawer placement={'left'} onClose={onClose} isOpen={isOpen} size={'lg'}>
			<DrawerOverlay />
			<DrawerContent backgroundColor={theme === 'dark' ? '#252525' : 'white'}>
				<DrawerCloseButton color={theme === 'dark' ? 'white' : 'black'} />
				<DrawerHeader borderBottomWidth='1px' textColor={theme === 'dark' ? 'white' : 'black'}>
					Settings
				</DrawerHeader>
				<DrawerBody>
					<Flex
						direction={'column'}
						width='full'
						py={'1rem'}
						px={'1rem'}
						height={'calc(100% - 10px)'}
					>
						<Box marginTop={'1rem'} height={'full'}>
							{phoneState ? (
								<section>
									<Flex justifyContent={'space-between'} alignItems={'center'}>
										<Text
											className='text-black dark:text-white'
											fontSize={'md'}
											fontWeight={'medium'}
										>
											{phoneState.name}
										</Text>
										<Text className='text-gray-800 dark:text-gray-300'>{userType}</Text>
									</Flex>
									<Box
										marginTop={'0.25rem'}
										className='bg-[#C6E3FF] dark:bg-[#234768]'
										paddingX={'1rem'}
										paddingY={'0.5rem'}
										width={'max-content'}
										rounded={'md'}
									>
										<Text className='text-[#158FFF] dark:text-[#158FFF]'>
											{phoneState.phone_number ? `+${phoneState.phone_number}` : ''}
										</Text>
									</Box>
								</section>
							) : (
								<Button colorScheme='green' width={'full'} onClick={handleLinkWhatsapp}>
									Link Whatsapp
								</Button>
							)}

							{phoneState ? (
								<section>
									<Flex marginTop={'1rem'} rounded={'md'} alignItems={'center'}>
										<Text color='gray.400' fontWeight={'semibold'}>
											Plan
										</Text>
										<Box bgColor={'gray.400'} width={'full'} height={'2px'} marginLeft={'1rem'} />
									</Flex>

									<Box
										marginTop={'0.25rem'}
										className={`${
											isSubscribed
												? 'dark:bg-[#235C39] bg-[#B4FED0]'
												: 'dark:bg-[#541919] bg-[#FFC9C9]'
										}`}
										paddingX={'1rem'}
										paddingY={'0.5rem'}
										width={'max-content'}
										rounded={'md'}
									>
										<Text textColor={isSubscribed ? '#34F27B' : '#FF2626'}>
											{isSubscribed ? 'Active' : 'Not Subscribed'}
										</Text>
									</Box>
									{isSubscribed ? (
										<Flex marginTop={'0.5rem'} gap={'0.5rem'} alignItems={'center'}>
											<InfoOutlineIcon color={'#BB2525'} width={4} />
											<Text color={'#BB2525'}>Expires On {phoneState.session_expires_at}</Text>
										</Flex>
									) : null}
								</section>
							) : null}

							<section>
								<Flex
									marginTop={'1rem'}
									rounded={'md'}
									alignItems={'center'}
									hidden={PAYMENT_RECORDS.length === 0}
								>
									<Text color='gray.400' fontWeight={'semibold'}>
										Payment History
									</Text>
									<Box bgColor={'gray.400'} flexGrow={'1'} height={'2px'} marginLeft={'1rem'} />
								</Flex>

								<VStack
									marginTop={'0.25rem'}
									paddingX={'1rem'}
									paddingY={'0.5rem'}
									alignItems={'center'}
									rounded={'md'}
									flexDirection={'column'}
									hidden={PAYMENT_RECORDS.length === 0}
								>
									<HStack justifyContent={'end'} width={'full'}>
										<Button
											variant='solid'
											backgroundColor={'green.500'}
											color={'white'}
											onClick={() =>
												PaymentService.paymentRecords({
													csv: true,
												})
											}
											_hover={{
												backgroundColor: 'green.600',
											}}
										>
											Export
										</Button>
										<Button
											hidden={true}
											variant='solid'
											backgroundColor={'blue.500'}
											color={'white'}
											_hover={{
												backgroundColor: 'blue.600',
											}}
										>
											Download Invoice
										</Button>
									</HStack>
									<TableContainer
										border={'1px'}
										borderColor={'gray.100'}
										rounded={'lg'}
										paddingTop={'0.5rem'}
										marginTop={'0.5rem'}
										width={'full'}
									>
										<Table size={'sm'} className='text-gray-800 dark:text-gray-300'>
											<Thead className='text-gray-900 dark:text-gray-100'>
												<Tr>
													<Th width={'50%'}>Date</Th>
													<Th width={'40%'} isNumeric>
														Amount
													</Th>
													<Th width={'10%'}>Invoice</Th>
												</Tr>
											</Thead>
											<Tbody>
												{PAYMENT_RECORDS.map((record, index) => {
													if (record.type === 'subscription')
														return (
															<Tr key={index}>
																<Td>Subscription - {record.plan}</Td>
																<Td isNumeric>
																	{record.isActive
																		? 'active'
																		: record.isPaused
																		? 'paused'
																		: 'on-hold'}
																</Td>
																<Td>Invoice</Td>
															</Tr>
														);
													else
														return (
															<Tr key={index}>
																<Td>{record.date}</Td>
																<Td isNumeric>{record.amount}</Td>
																<Td>
																	<IconButton
																		aria-label='Download Invoice'
																		icon={<DownloadIcon />}
																		colorScheme='blue'
																		size='sm'
																		variant='ghost'
																		onClick={() =>
																			PaymentService.paymentInvoiceDownload(record.id, record.date)
																		}
																	/>
																</Td>
															</Tr>
														);
												})}
											</Tbody>
										</Table>
									</TableContainer>
								</VStack>
							</section>

							<section className=' flex flex-col justify-end flex-1'>
								<Button
									width={'full'}
									colorScheme='yellow'
									onClick={() => changePasswordRef.current?.open()}
								>
									Change Password
								</Button>
								<Button
									width={'full'}
									colorScheme='red'
									marginTop={'1rem'}
									hidden={phoneState === null}
									onClick={logoutWhatsapp}
								>
									Logout Whatsapp
								</Button>
							</section>
						</Box>
					</Flex>
				</DrawerBody>
			</DrawerContent>
			<ChangePassword ref={changePasswordRef} />
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
		</Drawer>
	);
}
