import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Flex,
	FormControl,
	FormErrorMessage,
	HStack,
	Heading,
	IconButton,
	Input,
	Text,
	useToast,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BiTrash } from 'react-icons/bi';
import { MdCampaign } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { NAVIGATION } from '../../../config/const';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import { SchedulerByDateService } from '../../../services/scheduler-by-date.service';
import { StoreNames, StoreState } from '../../../store';
import {
	addBlankDate,
	removeDate,
	reset,
	resetSelectedScheduler,
	setAttachments,
	setCampaignNameError,
	setContactCards,
	setDailyCount,
	setDailyCountError,
	setDate,
	setDateError,
	setEditingScheduler,
	setEndTime,
	setMessageError,
	setPolls,
	setRecipients,
	setRecipientsError,
	setStartTime,
} from '../../../store/reducers/SchedulerByDateReducer';
import AddOns from '../../components/add-ons';
import ConfirmationAlert, { ConfirmationAlertHandle } from '../../components/confirmation-alert';
import SubscriptionAlert, {
	AddDevicePopup,
	SubscriptionPopup,
} from '../../components/subscription-alert';
import { CampaignDetailsSection, MessageInputSection } from './components';
import SchedulerList from './components/message-scheduler-list';

export default function SchedulerByDate() {
	const toast = useToast();
	const dispatch = useDispatch();
	const theme = useTheme();
	const navigate = useNavigate();
	const confirmRef = useRef<ConfirmationAlertHandle>(null);

	const {
		details,
		ui: { apiError, dateError, dailyCountError, editingMessage },
		all_schedulers,
	} = useSelector((state: StoreState) => state[StoreNames.SCHEDULER_BY_DATE]);

	const { groups, labels } = useSelector((state: StoreState) => state[StoreNames.USER]);
	const { list: csvList } = useSelector((state: StoreState) => state[StoreNames.CSV]);

	useEffect(() => {
		pushToNavbar({
			title: 'Scheduler By Date',
			icon: MdCampaign,
			link: NAVIGATION.SCHEDULER_BY_DATE,
		});
		return () => {
			popFromNavbar();
		};
	}, []);

	const fetchRecipients = useCallback(
		function (type: string) {
			if (['GROUP', 'GROUP_INDIVIDUAL', 'GROUP_INDIVIDUAL_WITHOUT_ADMINS'].includes(type)) {
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
		if (!details.title) {
			dispatch(setCampaignNameError(true));

			hasError = true;
		}
		if (!details.id && all_schedulers.find((campaign) => campaign.title === details.title)) {
			toast({
				title: 'Scheduler Name',
				description: 'Scheduler name already exists',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			hasError = true;
		}
		if (details.recipient_from === 'CSV' && details.recipient_data === '') {
			dispatch(setRecipientsError(true));

			hasError = true;
		}
		if (details.recipient_from === 'GROUP' && details.recipient_data.length === 0) {
			dispatch(setRecipientsError(true));

			hasError = true;
		}
		if (details.recipient_from === 'GROUP_INDIVIDUAL' && details.recipient_data.length === 0) {
			dispatch(setRecipientsError(true));

			hasError = true;
		}
		if (details.recipient_from === 'LABEL' && details.recipient_data.length === 0) {
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
		if (
			details.daily_count === '' ||
			details.daily_count === '0' ||
			Number.isNaN(Number(details.daily_count))
		) {
			dispatch(setDailyCountError('Please enter a valid count'));

			hasError = true;
		}
		if (details.dates.length == 0) {
			toast({
				title: 'Date',
				description: 'Please select at least one date',
				status: 'error',
			});
			hasError = true;
		}
		for (let i = 0; i < details.dates.length; i++) {
			if (details.dates[i] === '') {
				dispatch(setDateError(true));
				hasError = true;
			}
		}
		const uniqueDates = new Set(details.dates);
		if (uniqueDates.size !== details.dates.length) {
			toast({
				title: 'Duplicate Date',
				description: 'Please select unique dates',
				status: 'error',
			});
			hasError = true;
		}
		return !hasError;
	};

	const [isAlertMessage, setIsAlertMessage] = useState(false);
	const [readMoreDetails, setReadMoreDetails] = useState({
		title: '',
		message: '',
	});

	const scheduleMessage = (remove_duplicates: boolean) => {
		if (!validate()) {
			return;
		}
		const data = {
			...details,
			daily_count: Number(details.daily_count),
			remove_duplicates,
		};

		if (details.id) {
			SchedulerByDateService.updateScheduler(data);
			dispatch(setEditingScheduler(false));
			toast({
				title: 'Update is under process.',
				description: 'Check Task page for status',
				status: 'success',
				duration: 5000,
				isClosable: true,
			});
		} else {
			SchedulerByDateService.createScheduler(data);
			toast({
				title: 'Scheduler is under process.',
				description: 'Check Task page for status',
				status: 'success',
				duration: 5000,
				isClosable: true,
			});
		}
		dispatch(resetSelectedScheduler());
	};

	const handleReadMoreInput = (type: string, value: string) => {
		setReadMoreDetails((prev) => ({
			...prev,
			[type]: value,
		}));
	};

	useEffect(() => {
		fetchRecipients(details.recipient_from);
	}, [fetchRecipients, details.recipient_from]);

	useEffect(() => {
		dispatch(reset());
	}, [dispatch]);

	return (
		<Flex padding={'1rem'} justifyContent={'center'} width={'full'}>
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
								Message Preference{' '}
							</Text>
							<Box color={'red.400'} marginTop={'0.25rem'}>
								*If Daily Count is more than total numbers scheduled then messages will go multiple
								times.
							</Box>
							<Flex gap={2}>
								<FormControl flexGrow={1} isInvalid={!!dailyCountError}>
									<Text fontSize='sm' className='text-gray-700 dark:text-white'>
										Daily Message Count
									</Text>
									<Input
										type='number'
										width={'full'}
										placeholder='eg. 100'
										rounded={'md'}
										border={'none'}
										className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
										_focus={{
											border: 'none',
											outline: 'none',
										}}
										value={details.daily_count}
										onChange={(e) => dispatch(setDailyCount(e.target.value))}
									/>
									<FormErrorMessage>{dailyCountError}</FormErrorMessage>
								</FormControl>
								<TimeInput
									placeholder='Start At (in IST)'
									onChange={(text) => dispatch(setStartTime(text))}
									value={details.start_time}
								/>
								<TimeInput
									placeholder='End At (in IST)'
									onChange={(text) => dispatch(setEndTime(text))}
									value={details.end_time}
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
							<DateSelectors dates={details.dates} error={dateError} />
						</Flex>
					</HStack>
					{/* ---------------------------SCHEDULE BUTTON SECTION---------------------- */}
					{!!apiError && (
						<Text pt={4} color={'tomato'}>
							{apiError}
						</Text>
					)}
					{editingMessage ? (
						<HStack>
							<Button
								colorScheme='red'
								width={'full'}
								variant='solid'
								mt={8}
								onClick={() => {
									dispatch(setEditingScheduler(false));
								}}
							>
								Cancel
							</Button>
							<Button
								colorScheme='green'
								variant='solid'
								width='full'
								mt={8}
								onClick={() => {
									if (!validate()) {
										return;
									}
									confirmRef.current?.open();
								}}
							>
								Edit
							</Button>
						</HStack>
					) : (
						<Button
							colorScheme='green'
							variant='solid'
							width='full'
							mt={8}
							onClick={() => {
								if (!validate()) {
									return;
								}
								confirmRef.current?.open();
							}}
						>
							Schedule
						</Button>
					)}
					<Text textAlign={'center'} color={'red.400'} marginTop={'0.25rem'}>
						Please ensure not to spam using this tool
					</Text>
					<Text textAlign={'center'} color={'red.400'} marginTop={'0.25rem'}>
						All the changes made will take some time, please refer to
						<Box
							as='span'
							onClick={() => {
								navigate(NAVIGATION.TASKS);
							}}
							ml={1}
							className='hover:underline hover:cursor-pointer'
						>
							Task Page
						</Box>{' '}
						status, refresh the page to see the changes
					</Text>
				</Box>
				<SchedulerList />
			</Flex>
			<SubscriptionAlert />
			<ConfirmationAlert
				cancelButton={false}
				onConfirm={() => scheduleMessage(false)}
				confirmText='Proceed with Duplicates'
				secondaryAction={() => scheduleMessage(true)}
				secondaryText='Exclude Duplicates'
				disclaimer='There might be some duplicate numbers in the campaign you are scheduling.'
				ref={confirmRef}
			/>
		</Flex>
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

function DateSelectors({ dates, error }: { dates: string[]; error: boolean }) {
	const dispatch = useDispatch();
	const toast = useToast();

	function onDateChange({ index, date }: { index: number; date: string }) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const selectedDate = new Date(date);
		if (selectedDate < today) {
			toast({
				title: 'Invalid Date',
				description: 'Please select a future date',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		dispatch(setDate({ index, date }));
	}

	return (
		<Box>
			<Flex wrap={'wrap'} gap={4}>
				<Button colorScheme='green' onClick={() => dispatch(addBlankDate())}>
					Add Date
				</Button>
				{dates.map((date, index) => (
					<Box key={index} className='inline-flex gap-2'>
						<FormControl isInvalid={error}>
							<Input
								type='date'
								value={date}
								onChange={(e) => onDateChange({ index, date: e.target.value })}
								className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
							/>
						</FormControl>
						<IconButton
							colorScheme='red'
							onClick={() => dispatch(removeDate(index))}
							aria-label='Add Date'
							icon={<BiTrash />}
						/>
					</Box>
				))}
			</Flex>
		</Box>
	);
}
