import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Center,
	Divider,
	Flex,
	FormControl,
	FormLabel,
	HStack,
	Heading,
	Input,
	Select,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	VStack,
	useToast,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { MdCampaign } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { NAVIGATION } from '../../../config/const';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import MessageService from '../../../services/message.service';
import { StoreNames, StoreState } from '../../../store';
import {
	addScheduler,
	editSelectedScheduler,
	reset,
	setAPIError,
	setAttachments,
	setBatchDelay,
	setBatchDelayError,
	setBatchSize,
	setBatchSizeError,
	setCSVFile,
	setCampaignName,
	setCampaignNameError,
	setContactCards,
	setEndTime,
	setMaxDelay,
	setMaxDelayError,
	setMessageError,
	setMinDelay,
	setMinDelayError,
	setPolls,
	setRecipients,
	setRecipientsError,
	setRecipientsFrom,
	setStartTime,
	setStateDate,
	setVariables,
} from '../../../store/reducers/SchedulerReducer';
import AddOns from '../../components/add-ons';
import SubscriptionAlert, {
	AddDevicePopup,
	SubscriptionPopup,
} from '../../components/subscription-alert';
import { MessageInputSection, MessageSchedulerList } from './components';
import CampaignDetailsSection from './components/campaign-details-section';

export type SchedulerDetails = {
	type: 'NUMBERS' | 'CSV' | 'GROUP' | 'LABEL' | 'GROUP_INDIVIDUAL';
	numbers?: string[];
	csv_file: string;
	group_ids: string[];
	label_ids: string[];
	message: string;
	variables: string[];
	shared_contact_cards: string[];
	attachments: string[];
	campaign_name: string;
	min_delay: number;
	max_delay: number;
	startTime: string;
	endTime: string;
	batch_delay: number;
	batch_size: number;
};

export default function Scheduler() {
	const toast = useToast();
	const dispatch = useDispatch();
	const theme = useTheme();

	const [uiDetails, setUIDetails] = useState<{
		uploadingCSV: boolean;
		deletingCSV: boolean;
		recipientsLoading: boolean;
		loadingVerifiedContacts: boolean;
		schedulingMessages: boolean;
	}>({
		uploadingCSV: false,
		deletingCSV: false,
		recipientsLoading: false,
		loadingVerifiedContacts: false,
		schedulingMessages: false,
	});

	const {
		details,
		recipients,
		all_schedulers,
		ui: {
			apiError,
			campaignNameError,
			recipientsError,
			editingMessage,
			minDelayError,
			maxDelayError,
			batchDelayError,
			batchSizeError,
		},
	} = useSelector((state: StoreState) => state[StoreNames.SCHEDULER]);

	const { groups, labels } = useSelector((state: StoreState) => state[StoreNames.USER]);
	const { list: csvList } = useSelector((state: StoreState) => state[StoreNames.CSV]);
	const csvListWithDate = csvList.filter(
		(item) =>
			item.headers.includes('number') &&
			item.headers.includes('date') &&
			item.headers.includes('month')
	);

	useEffect(() => {
		pushToNavbar({
			title: 'Campaign Scheduler',
			icon: MdCampaign,
			link: NAVIGATION.SCHEDULER,
		});
		return () => {
			popFromNavbar();
		};
	}, []);

	const fetchRecipients = useCallback(
		function (type: string) {
			if (type === 'GROUP' || type === 'GROUP_INDIVIDUAL') {
				dispatch(setRecipients(groups));
			} else if (type === 'LABEL') {
				dispatch(setRecipients(labels));
			} else if (type === 'CSV') {
				dispatch(setRecipients(csvList));
			}
		},
		[dispatch, groups, labels, csvList]
	);

	const validate = () => {
		let hasError = false;
		if (!details.campaign_name) {
			dispatch(setCampaignNameError(true));
			hasError = true;
		}

		if (details.type === 'CSV' && details.csv_file === '') {
			dispatch(setRecipientsError(true));
			hasError = true;
		}
		if (details.type === 'GROUP' && details.group_ids.length === 0) {
			dispatch(setRecipientsError(true));
			hasError = true;
		}
		if (details.type === 'GROUP_INDIVIDUAL' && details.group_ids.length === 0) {
			dispatch(setRecipientsError(true));
			hasError = true;
		}
		if (details.type === 'LABEL' && details.label_ids.length === 0) {
			dispatch(setRecipientsError(true));
			hasError = true;
		}
		if (isAlertMessage) {
			if (!readMoreDetails.title && !readMoreDetails.message) {
				dispatch(setMessageError(true));
				hasError = true;
			}
		} else {
			if (
				!details.message &&
				details.attachments.length === 0 &&
				details.shared_contact_cards.length === 0 &&
				details.polls.length === 0
			) {
				dispatch(setMessageError(true));
				hasError = true;
			}
		}
		if (details.min_delay < 1) {
			dispatch(setMinDelayError(true));
			hasError = true;
		}
		if (details.max_delay < 1) {
			dispatch(setMaxDelayError(true));
			hasError = true;
		}
		if (details.batch_size < 1) {
			dispatch(setBatchSizeError(true));
			hasError = true;
		}
		if (details.batch_delay < 1) {
			dispatch(setBatchDelayError(true));
			hasError = true;
		}
		return !hasError;
	};

	const [isAlertMessage, setIsAlertMessage] = useState(false);
	const [readMoreDetails, setReadMoreDetails] = useState({
		title: '',
		message: '',
	});

	const scheduleMessage = () => {
		if (!validate()) {
			return;
		}
		setUIDetails((prev) => ({
			...prev,
			schedulingMessages: true,
		}));

		MessageService.scheduleCampaign({
			...details,
			message: isAlertMessage
				? readMoreDetails.title + '\n' + '\u200B'.repeat(4000) + readMoreDetails.message
				: details.message,
		})
			.then((success) => {
				if (!success) {
					return toast({
						title: 'Campaign scheduler.',
						description: 'Cannot schedule campaign. Please try again later.',
						status: 'error',
						duration: 3000,
						isClosable: true,
					});
				}
				dispatch(reset());
				setReadMoreDetails({
					title: '',
					message: '',
				});
				toast({
					title: 'Campaign scheduler.',
					description: 'Campaign is being Scheduled',
					status: 'info',
					duration: 3000,
					isClosable: true,
				});
			})
			.finally(() => {
				setUIDetails((prev) => ({
					...prev,
					schedulingMessages: false,
				}));
			});
	};

	const handleScheduleMessage = () => {
		if (!validate()) {
			return;
		}
		setUIDetails((prev) => ({
			...prev,
			schedulingMessages: true,
		}));

		MessageService.scheduleMessage({
			title: details.campaign_name,
			message: isAlertMessage
				? readMoreDetails.title + '\n' + '\u200B'.repeat(4000) + readMoreDetails.message
				: details.message,
			csv: details.csv_file,
			attachments: details.attachments,
			shared_contact_cards: details.shared_contact_cards,
			polls: details.polls,
			start_from: details.startTime,
			end_at: details.endTime,
			random_string: details.random_string,
		})
			.then((res) => {
				if (!res) {
					return;
				}
				dispatch(addScheduler(res));
			})
			.finally(() => {
				setUIDetails((prev) => ({
					...prev,
					schedulingMessages: false,
				}));
				setReadMoreDetails({
					title: '',
					message: '',
				});
			});
	};

	const editScheduledMessage = async () => {
		if (details.campaign_name === '') {
			dispatch(setCampaignNameError(true));
			return;
		}

		if (details.csv_file === '') {
			dispatch(setRecipientsError(true));
			return;
		}

		if (details.startTime === '') {
			dispatch(setAPIError('Please select start time'));
			setTimeout(() => {
				dispatch(setAPIError(''));
			}, 5000);
			return;
		}

		if (details.endTime === '') {
			dispatch(setAPIError('Please select end time'));
			setTimeout(() => {
				dispatch(setAPIError(''));
			}, 5000);
			return;
		}

		if (
			details.message === '' &&
			details.attachments.length === 0 &&
			details.shared_contact_cards.length === 0 &&
			details.polls.length === 0
		) {
			dispatch(setMessageError(true));
			return;
		}

		setUIDetails((prev) => ({
			...prev,
			schedulingMessages: true,
		}));

		MessageService.editScheduledMessage({
			attachments: details.attachments,
			end_at: details.endTime,
			id: details.message_scheduler_id,
			message: details.message,
			polls: details.polls,
			shared_contact_cards: details.shared_contact_cards,
			start_from: details.startDate,
			title: details.campaign_name,
			csv: csvList.find((csv) => csv.fileName === details.csv_file)?.id ?? '',
			random_string: details.random_string,
		})
			.then((res) => {
				if (res) dispatch(editSelectedScheduler(res));
			})
			.finally(() => {
				setUIDetails((prev) => ({
					...prev,
					schedulingMessages: false,
				}));
			});
	};

	const handleReadMoreInput = (type: string, value: string) => {
		setReadMoreDetails((prev) => ({
			...prev,
			[type]: value,
		}));
	};

	useEffect(() => {
		fetchRecipients(details.type);
	}, [fetchRecipients, details.type]);

	useEffect(() => {
		dispatch(reset());
	}, [dispatch]);

	return (
		<Flex padding={'1rem'} justifyContent={'center'} width={'full'}>
			<Tabs isFitted variant='enclosed' width={'full'} color={theme === 'dark' ? 'white' : 'black'}>
				<TabList mb='1em'>
					<Tab onClick={() => dispatch(reset())}>Schedule Campaign</Tab>
					<Tab
						onClick={() => {
							dispatch(reset());
							dispatch(setRecipientsFrom('CSV'));
						}}
					>
						Schedule Message
					</Tab>
				</TabList>
				<TabPanels>
					{/* ------------------------------Scheduler Section----------------------------- */}
					<TabPanel width={'full'}>
						<Flex direction={'column'} width={'full'}>
							<AddDevicePopup />
							<SubscriptionPopup />
							<HStack width={'full'} justifyContent={'space-between'}>
								<Heading
									color={theme === 'dark' ? 'white' : 'GrayText'}
									fontSize={'large'}
									fontWeight={'medium'}
								>
									Campaign Details
								</Heading>
								<Button
									colorScheme='blue'
									leftIcon={<InfoOutlineIcon />}
									onClick={() =>
										window
											?.open(
												'https://docs.google.com/spreadsheets/d/1qj7u0e8OhrFHYj6bHlPAnORC5uRpKI3xoxW7PRAjxWM/edit#gid=0',
												'_blank'
											)
											?.focus()
									}
								>
									See CSV example
								</Button>
							</HStack>
							<Box marginTop={'1rem'}>
								<CampaignDetailsSection fetchRecipients={fetchRecipients} />

								<HStack gap={8} alignItems={'start'}>
									<Box marginTop={'0.5rem'} paddingTop={2} flex={1}>
										<MessageInputSection
											handleReadMoreInput={handleReadMoreInput}
											isAlertMessage={isAlertMessage}
											readMoreDetails={readMoreDetails}
											setIsAlertMessage={setIsAlertMessage}
											setReadMoreDetails={setReadMoreDetails}
										/>
									</Box>
									{/* ----------------------MESSAGE DELAY INPUT SECTION---------------- */}
									<Flex flex={1} flexDirection={'column'} gap={3}>
										<Text
											className='text-gray-700 dark:text-white'
											fontWeight={'medium'}
											marginTop={'1rem'}
										>
											Message Delay
										</Text>
										<Flex gap={4}>
											<DelayInput
												placeholder='Min Delay (in sec)'
												value={details.min_delay}
												onChange={(num) => dispatch(setMinDelay(num))}
												invalid={minDelayError}
											/>
											<DelayInput
												placeholder='Max Delay (in sec)'
												value={details.max_delay}
												onChange={(num) => dispatch(setMaxDelay(num))}
												invalid={maxDelayError}
											/>
											<DelayInput
												placeholder='Batch Size'
												value={details.batch_size}
												onChange={(num) => dispatch(setBatchSize(num))}
												invalid={batchSizeError}
											/>
											<DelayInput
												placeholder='Batch Delay'
												value={details.batch_delay}
												onChange={(num) => dispatch(setBatchDelay(num))}
												invalid={batchDelayError}
											/>
										</Flex>

										<Flex gap={2}>
											<FormControl flexGrow={1}>
												<Text fontSize='sm' className='text-gray-700 dark:text-white'>
													Start Date
												</Text>
												<Input
													type='date'
													width={'full'}
													placeholder='00:00'
													rounded={'md'}
													border={'none'}
													className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
													_focus={{
														border: 'none',
														outline: 'none',
													}}
													value={details.startDate}
													onChange={(e) => dispatch(setStateDate(e.target.value))}
												/>
											</FormControl>
											<TimeInput
												placeholder='Start At (in IST)'
												onChange={(text) => dispatch(setStartTime(text))}
												value={details.startTime}
											/>
											<TimeInput
												placeholder='End At (in IST)'
												onChange={(text) => dispatch(setEndTime(text))}
												value={details.endTime}
											/>
										</Flex>
										<AddOns
											marginTop={'0.5rem'}
											attachments={details.attachments}
											shared_contact_cards={details.shared_contact_cards}
											polls={details.polls}
											onAttachmentsSelected={(ids) => dispatch(setAttachments(ids))}
											onContactsSelected={(ids) => dispatch(setContactCards(ids))}
											onPollsSelected={(polls) => dispatch(setPolls(polls))}
										/>
									</Flex>
								</HStack>
								{/* ---------------------------SCHEDULE BUTTON SECTION---------------------- */}
								{!!apiError && (
									<Text pt={4} color={'tomato'}>
										{apiError}
									</Text>
								)}
								<Button
									colorScheme='green'
									variant='solid'
									width='full'
									mt={8}
									onClick={scheduleMessage}
									isLoading={uiDetails.schedulingMessages}
								>
									Schedule
								</Button>
								<Text textAlign={'center'} color={'red.400'} marginTop={'0.25rem'}>
									Please ensure not to spam using this tool
								</Text>
							</Box>
						</Flex>
						<SubscriptionAlert />
					</TabPanel>
					{/* ---------------------------Message Section------------------------------ */}
					<TabPanel>
						<Flex direction={'column'} width={'full'}>
							<HStack width={'full'} justifyContent={'space-between'}>
								<Heading
									color={theme === 'dark' ? 'white' : 'GrayText'}
									fontSize={'large'}
									fontWeight={'medium'}
								>
									Message Details
								</Heading>
								<Button
									colorScheme='blue'
									leftIcon={<InfoOutlineIcon />}
									onClick={() =>
										window
											?.open(
												'https://docs.google.com/spreadsheets/d/1qj7u0e8OhrFHYj6bHlPAnORC5uRpKI3xoxW7PRAjxWM/edit#gid=0',
												'_blank'
											)
											?.focus()
									}
								>
									See CSV example
								</Button>
							</HStack>
							<Flex gap='2rem' marginTop={'1rem'}>
								<VStack alignItems={'flex-start'} flex={1} gap={'0.5rem'}>
									<FormControl isInvalid={campaignNameError}>
										<FormLabel>Title</FormLabel>
										<Input
											placeholder='Message Name'
											type='text'
											value={details.campaign_name}
											onChange={(e) => dispatch(setCampaignName(e.target.value))}
										/>
									</FormControl>
									<FormControl isInvalid={recipientsError}>
										<FormLabel>Select CSV</FormLabel>
										<Select
											className='!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full text-black dark:text-white '
											border={'none'}
											value={details.csv_file}
											onChange={(e) => {
												dispatch(setRecipientsError(false));
												dispatch(setCSVFile(e.target.value));
												const recipient = recipients.find(
													(recipient) => recipient.id === e.target.value
												);
												if (!recipient || !recipient.headers) return;
												if (recipient) dispatch(setVariables(recipient.headers));
											}}
										>
											<option
												value={'select'}
												className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
											>
												Select one!
											</option>
											{csvListWithDate.map(({ id, name }) => (
												<option
													className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
													value={id}
													key={id}
												>
													{name}
												</option>
											))}
										</Select>
									</FormControl>

									<Text
										width={'full'}
										className='text-gray-700 dark:text-white'
										fontWeight={'medium'}
										textAlign={'left'}
									>
										Timing Section
									</Text>
									<Flex gap={2} width={'full'}>
										<TimeInput
											placeholder='Start At (in IST)'
											onChange={(text) => dispatch(setStartTime(text))}
											value={details.startTime}
										/>
										<TimeInput
											placeholder='End At (in IST)'
											onChange={(text) => dispatch(setEndTime(text))}
											value={details.endTime}
										/>
									</Flex>
									<AddOns
										width={'full'}
										attachments={details.attachments}
										shared_contact_cards={details.shared_contact_cards}
										polls={details.polls}
										onAttachmentsSelected={(ids) => dispatch(setAttachments(ids))}
										onContactsSelected={(ids) => dispatch(setContactCards(ids))}
										onPollsSelected={(polls) => dispatch(setPolls(polls))}
									/>
									<HStack width={'full'}>
										{editingMessage && (
											<Button width={'full'} colorScheme='red' onClick={() => dispatch(reset())}>
												Cancel
											</Button>
										)}
										<Button
											width={'full'}
											colorScheme={editingMessage ? 'yellow' : 'green'}
											isLoading={uiDetails.schedulingMessages}
											onClick={editingMessage ? editScheduledMessage : handleScheduleMessage}
										>
											{editingMessage ? 'Edit Message' : 'Schedule Message'}
										</Button>
									</HStack>
									<Text width={'full'} textAlign={'center'} color={'red.400'}>
										Please ensure not to spam using this tool
									</Text>
								</VStack>
								<MessageInputSection
									handleReadMoreInput={handleReadMoreInput}
									isAlertMessage={isAlertMessage}
									readMoreDetails={readMoreDetails}
									setIsAlertMessage={setIsAlertMessage}
									setReadMoreDetails={setReadMoreDetails}
									textAreaProps={{
										minHeight: '245px',
									}}
								/>
							</Flex>

							<Center mt={'1rem'} gap={'0.5rem'} alignItems={'center'}>
								<InfoOutlineIcon color={'gray'} />
								<Text size={'md'} fontWeight={'bold'} textColor={'red.400'}>
									Message will be Scheduled at Mid-Night
								</Text>
							</Center>

							<Divider width={'full'} my={'1rem'} />
							{all_schedulers.length < 1 ? null : (
								<>
									<Heading
										color={theme === 'dark' ? 'white' : 'GrayText'}
										fontSize={'large'}
										fontWeight={'medium'}
										textAlign={'center'}
									>
										All Schedulers
									</Heading>
									<MessageSchedulerList />
								</>
							)}
						</Flex>
					</TabPanel>
				</TabPanels>
			</Tabs>
		</Flex>
	);
}

function DelayInput({
	onChange,
	placeholder,
	value,
	invalid,
}: {
	placeholder: string;
	value: number;
	onChange: (num: number) => void;
	invalid?: boolean;
}) {
	return (
		<FormControl flexGrow={1} isInvalid={invalid}>
			<Text fontSize='sm' className='text-gray-700 dark:text-white'>
				{placeholder}
			</Text>
			<Input
				width={'full'}
				placeholder='5'
				rounded={'md'}
				border={'none'}
				className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
				_focus={{
					border: 'none',
					outline: 'none',
				}}
				type='number'
				min={1}
				value={value.toString()}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</FormControl>
	);
}

function TimeInput({
	onChange,
	placeholder,
	value,
}: {
	placeholder: string;
	value: string;
	onChange: (text: string) => void;
}) {
	return (
		<FormControl flexGrow={1}>
			<Text fontSize='sm' className='text-gray-700 dark:text-white'>
				{placeholder}
			</Text>
			<Input
				type='time'
				width={'full'}
				placeholder='00:00'
				rounded={'md'}
				border={'none'}
				className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
				_focus={{
					border: 'none',
					outline: 'none',
				}}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</FormControl>
	);
}
