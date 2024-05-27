import { CheckIcon } from '@chakra-ui/icons';
import {
	AbsoluteCenter,
	Box,
	Button,
	Checkbox,
	Divider,
	Flex,
	FormControl,
	FormErrorMessage,
	HStack,
	IconButton,
	Input,
	Tag,
	TagLabel,
	Text,
	Textarea,
	useToast,
} from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { RiRobot2Line } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { NAVIGATION } from '../../../config/const';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import BotService from '../../../services/bot.service';
import { StoreNames, StoreState } from '../../../store';
import {
	addBot,
	reset,
	setAddingBot,
	setAttachments,
	setContactCards,
	setEndAt,
	setError,
	setForwardMessage,
	setForwardTo,
	setMessage,
	setNurturing,
	setOptions,
	setPolls,
	setRespondTo,
	setResponseDelayTime,
	setResponseDelayType,
	setStartAt,
	setTrigger,
	setTriggerGapTime,
	setTriggerGapType,
	toggleRandomString,
	updateBot,
} from '../../../store/reducers/BotReducers';
import AddOns from '../../components/add-ons';
import Info from '../../components/info';
import { AddDevicePopup, SubscriptionPopup } from '../../components/subscription-alert';
import AllResponders from './components/AllResponders';
import { NumberInput, SelectElement, TextAreaElement, TextInput } from './components/Inputs';

export default function Bot() {
	const dispatch = useDispatch();
	const theme = useTheme();
	const toast = useToast();
	const messageRef = useRef(0);

	const { details, trigger_gap, response_delay, ui } = useSelector(
		(state: StoreState) => state[StoreNames.CHATBOT]
	);
	const {
		trigger,
		message,
		options,
		respond_to,
		shared_contact_cards,
		attachments,
		response_delay_seconds,
		trigger_gap_seconds,
		forward,
	} = details;
	const { isAddingBot, isEditingBot } = ui;

	useEffect(() => {
		pushToNavbar({
			title: 'Auto Responder',
			icon: RiRobot2Line,
			link: NAVIGATION.BOT,
		});
		return () => {
			popFromNavbar();
		};
	}, []);

	function validate() {
		const errorPayload: {
			type:
				| 'triggerError'
				| 'messageError'
				| 'respondToError'
				| 'optionsError'
				| 'contactCardsError'
				| 'attachmentError'
				| 'triggerGapError'
				| 'responseGapError';
			error: string;
		} = {
			type: 'triggerError',
			error: '',
		};

		let notHasError = true;

		errorPayload.type = 'triggerError';
		errorPayload.error = '';
		dispatch(setError(errorPayload));

		if (
			!message &&
			attachments.length === 0 &&
			shared_contact_cards.length === 0 &&
			details.polls.length === 0
		) {
			errorPayload.type = 'messageError';
			errorPayload.error = 'Message or Attachment or Contact Card or Poll is required';
			dispatch(setError(errorPayload));
			notHasError = false;
		} else {
			errorPayload.type = 'messageError';
			errorPayload.error = '';
			dispatch(setError(errorPayload));
		}

		if (!respond_to) {
			errorPayload.type = 'respondToError';
			errorPayload.error = 'Recipients is required';
			dispatch(setError(errorPayload));
			notHasError = false;
		} else {
			errorPayload.type = 'respondToError';
			errorPayload.error = '';
			dispatch(setError(errorPayload));
		}

		if (!options) {
			errorPayload.type = 'optionsError';
			errorPayload.error = 'Conditions is required';
			dispatch(setError(errorPayload));
			notHasError = false;
		} else {
			errorPayload.type = 'optionsError';
			errorPayload.error = '';
			dispatch(setError(errorPayload));
		}

		if (response_delay_seconds <= 0) {
			errorPayload.type = 'responseGapError';
			errorPayload.error = 'Invalid Message Delay';
			dispatch(setError(errorPayload));
			notHasError = false;
		} else {
			errorPayload.type = 'responseGapError';
			errorPayload.error = '';
			dispatch(setError(errorPayload));
		}

		if (trigger_gap_seconds <= 0) {
			errorPayload.type = 'triggerGapError';
			errorPayload.error = 'Invalid Delay Gap';
			dispatch(setError(errorPayload));
			notHasError = false;
		} else {
			errorPayload.type = 'triggerGapError';
			errorPayload.error = '';
			dispatch(setError(errorPayload));
		}
		return notHasError;
	}

	const insertVariablesToMessage = (variable: string) => {
		dispatch(
			setMessage(
				details.message.substring(0, messageRef.current) +
					' ' +
					variable +
					' ' +
					details.message.substring(messageRef.current ?? 0, details.message.length)
			)
		);
	};

	async function handleSave() {
		if (!validate()) {
			return;
		}
		if (isEditingBot && !details.bot_id) return;
		dispatch(setAddingBot(true));
		const promise = isEditingBot
			? BotService.updateBot(details.bot_id, details)
			: BotService.createBot(details);

		toast.promise(promise, {
			success: (data) => {
				const acton = isEditingBot ? updateBot({ id: data.bot_id, data }) : addBot(data);
				dispatch(acton);
				dispatch(reset());
				return {
					title: 'Data saved successfully',
				};
			},
			error: {
				title: 'Error Saving Bot',
			},
			loading: { title: 'Saving Data', description: 'Please wait' },
		});
		dispatch(reset());
	}

	return (
		<Flex
			direction={'column'}
			gap={'0.5rem'}
			className='custom-scrollbar'
			justifyContent={'center'}
			px={'2rem'}
		>
			<Flex direction={'column'} gap={'0.5rem'}>
				<AddDevicePopup />
				<SubscriptionPopup />
				<Flex direction={'column'} borderRadius={'20px'} mb={'1rem'} gap={2}>
					{/*--------------------------------- TRIGGER SECTION--------------------------- */}
					<FormControl
						isInvalid={!!ui.triggerError}
						display={'flex'}
						flexDirection={'column'}
						gap={2}
					>
						<Flex justifyContent={'space-between'} alignItems={'center'}>
							<Text className='text-gray-700 dark:text-gray-400'>Trigger</Text>
							<Flex gap={2} alignItems={'center'}>
								<IconButton
									isRound={true}
									variant='solid'
									aria-label='Done'
									size='xs'
									icon={!trigger ? <CheckIcon color='white' /> : <></>}
									onClick={() => dispatch(setTrigger(''))}
									className={`${
										!trigger ? '!bg-[#4CB072]' : '!bg-[#A6A6A6] '
									} hover:!bg-green-700 `}
								/>
								<Text fontSize='sm' color={theme === 'dark' ? 'white' : 'black'}>
									Default Message
								</Text>
							</Flex>
						</Flex>
						<TextAreaElement
							value={trigger ?? ''}
							onChange={(e) => dispatch(setTrigger(e.target.value))}
							isInvalid={!!ui.triggerError}
							placeholder={'ex. hello'}
						/>
						{ui.triggerError && <FormErrorMessage>{ui.triggerError}</FormErrorMessage>}
					</FormControl>

					{/*--------------------------------- RECIPIENTS SECTION--------------------------- */}

					<Flex gap={4}>
						<FormControl isInvalid={!!ui.respondToError} flexGrow={1}>
							<Text className='text-gray-700 dark:text-gray-400'>Recipients</Text>
							<SelectElement
								value={respond_to}
								onChangeText={(text) => dispatch(setRespondTo(text))}
								options={[
									{
										value: 'ALL',
										title: 'All',
									},
									{
										value: 'SAVED_CONTACTS',
										title: 'Saved Contacts',
									},
									{
										value: 'NON_SAVED_CONTACTS',
										title: 'Non Saved Contacts',
									},
								]}
							/>
							{ui.respondToError && <FormErrorMessage>{ui.respondToError}</FormErrorMessage>}
						</FormControl>
						<FormControl isInvalid={!!ui.optionsError} flexGrow={1}>
							<Text className='text-gray-700 dark:text-gray-400'>Conditions</Text>
							<SelectElement
								value={options}
								onChangeText={(text) => dispatch(setOptions(text))}
								options={[
									{
										value: 'INCLUDES_IGNORE_CASE',
										title: 'Includes Ignore Case',
									},
									{
										value: 'INCLUDES_MATCH_CASE',
										title: 'Includes Match Case',
									},
									{
										value: 'EXACT_IGNORE_CASE',
										title: 'Exact Ignore Case',
									},
									{
										value: 'EXACT_MATCH_CASE',
										title: 'Exact Match Case',
									},
								]}
							/>
							{ui.optionsError && <FormErrorMessage>{ui.optionsError}</FormErrorMessage>}
						</FormControl>
					</Flex>

					{/*--------------------------------- MESSAGE SECTION--------------------------- */}

					<FormControl isInvalid={!!ui.messageError}>
						<Textarea
							value={message ?? ''}
							minHeight={'80px'}
							onMouseUp={(e: React.MouseEvent<HTMLTextAreaElement, MouseEvent>) => {
								if (e.target instanceof HTMLTextAreaElement) {
									messageRef.current = e.target.selectionStart;
								}
							}}
							onChange={(e) => {
								messageRef.current = e.target.selectionStart;
								dispatch(setMessage(e.target.value));
							}}
							isInvalid={!!ui.messageError}
							placeholder={'Type your message here. \nex. You are invited to join fanfest'}
							width={'full'}
							border={'none'}
							className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
							_placeholder={{ opacity: 0.4, color: 'inherit' }}
							_focus={{ border: 'none', outline: 'none' }}
						/>
						{ui.messageError && <FormErrorMessage>{ui.messageError}</FormErrorMessage>}
					</FormControl>
					<HStack width={'full'} justifyContent={'space-between'}>
						<Tag
							size={'sm'}
							m={'0.25rem'}
							p={'0.5rem'}
							width={'fit-content'}
							borderRadius='md'
							variant='solid'
							colorScheme='gray'
							_hover={{ cursor: 'pointer' }}
							onClick={() => insertVariablesToMessage('{{public_name}}')}
						>
							<TagLabel>{'{{public_name}}'}</TagLabel>
						</Tag>
						<Checkbox
							colorScheme='green'
							size='md'
							isChecked={details.random_string}
							onChange={() => dispatch(toggleRandomString())}
						>
							Append Random Text
						</Checkbox>
					</HStack>

					<HStack alignItems={'start'}>
						{/*--------------------------------- GAP & DELAY SECTION--------------------------- */}

						<FormControl isInvalid={!!ui.triggerGapError} flex={1}>
							<Flex alignItems={'center'}>
								<Text className='text-gray-700 dark:text-gray-400'>Gap Delay</Text>
								<Info>Time Gap if same trigger is sent.</Info>
							</Flex>

							<HStack>
								<NumberInput
									value={trigger_gap.time}
									onChangeText={(text) => dispatch(setTriggerGapTime(Number(text)))}
								/>
								<SelectElement
									value={trigger_gap.type}
									onChangeText={(text) => dispatch(setTriggerGapType(text))}
									options={[
										{
											value: 'SEC',
											title: 'Second',
										},
										{
											value: 'MINUTE',
											title: 'Min',
										},
										{
											value: 'HOUR',
											title: 'Hour',
										},
									]}
								/>
							</HStack>
							{ui.triggerGapError && <FormErrorMessage>{ui.triggerGapError}</FormErrorMessage>}
						</FormControl>
						<FormControl isInvalid={!!ui.responseGapError} flex={1}>
							<Flex alignItems={'center'}>
								<Text className='text-gray-700 dark:text-gray-400'>Message Delay</Text>
								<Info>Time Delay between trigger and response.</Info>
							</Flex>
							<HStack>
								<NumberInput
									value={response_delay.time}
									onChangeText={(text) => dispatch(setResponseDelayTime(text))}
								/>
								<SelectElement
									value={response_delay.type}
									onChangeText={(text) => dispatch(setResponseDelayType(text))}
									options={[
										{
											value: 'SEC',
											title: 'Second',
										},
										{
											value: 'MINUTE',
											title: 'Min',
										},
										{
											value: 'HOUR',
											title: 'Hour',
										},
									]}
								/>
							</HStack>
							{ui.responseGapError && <FormErrorMessage>{ui.responseGapError}</FormErrorMessage>}
						</FormControl>
						<Flex flex={1} gap={'0.5rem'}>
							<FormControl flex={1}>
								<Text className='text-gray-700 dark:text-gray-400'>Start At (in IST)</Text>
								<Input
									type='time'
									placeholder='00:00'
									rounded={'md'}
									border={'none'}
									className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
									_focus={{
										border: 'none',
										outline: 'none',
									}}
									value={details.startAt}
									onChange={(e) => dispatch(setStartAt(e.target.value))}
								/>
							</FormControl>
							<FormControl flex={1}>
								<Text className='text-gray-700 dark:text-gray-400'>End At (in IST)</Text>
								<Input
									type='time'
									width={'full'}
									placeholder='23:59'
									rounded={'md'}
									border={'none'}
									className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
									_focus={{
										border: 'none',
										outline: 'none',
									}}
									value={details.endAt}
									onChange={(e) => dispatch(setEndAt(e.target.value))}
								/>
							</FormControl>
						</Flex>
					</HStack>

					{/*--------------------------------- ATTACHMENTS, CONTACTS & POLLS SECTION--------------------------- */}
					<AddOns
						attachments={details.attachments}
						shared_contact_cards={shared_contact_cards}
						polls={details.polls}
						nurturing={details.nurturing}
						onAttachmentsSelected={(ids) => dispatch(setAttachments(ids))}
						onContactsSelected={(ids) => dispatch(setContactCards(ids))}
						onPollsSelected={(ids) => dispatch(setPolls(ids))}
						onLeadNurturingSelected={(nurturing) => dispatch(setNurturing(nurturing))}
					/>

					{/*--------------------------------- FORWARD SECTION--------------------------- */}
					<Flex direction={'column'} gap={2} mt={'1rem'}>
						<Box position='relative'>
							<Divider height='2px' />
							<AbsoluteCenter
								bg={theme === 'dark' ? '#252525' : 'white'}
								px='4'
								color={theme === 'dark' ? 'gray.400' : 'gray.500'}
							>
								Forward Leads
							</AbsoluteCenter>
						</Box>
						<Box flex={1} mt={'0.5rem'}>
							<Text className='text-gray-700 dark:text-gray-400'>Forward To (without +)</Text>
							<TextInput
								placeholder='ex 9175XXXXXX68'
								value={forward.number ?? ''}
								onChangeText={(text) => dispatch(setForwardTo(text))}
							/>
						</Box>

						<Box flex={1}>
							<Text className='text-gray-700 dark:text-gray-400'>Forward Message</Text>
							<TextAreaElement
								value={forward.message ?? ''}
								onChange={(e) => dispatch(setForwardMessage(e.target.value))}
								isInvalid={false}
								placeholder={'ex. Forwarded Lead'}
							/>
						</Box>
					</Flex>

					{/*--------------------------------- BUTTONS SECTION--------------------------- */}

					<HStack justifyContent={'space-between'} alignItems={'center'} py={8}>
						{isEditingBot ? (
							<>
								<Button
									bgColor={'red.300'}
									width={'100%'}
									onClick={() => dispatch(reset())}
									isLoading={isAddingBot}
								>
									<Text color={'white'}>Cancel</Text>
								</Button>
								<Button
									isLoading={isAddingBot}
									bgColor={'green.300'}
									_hover={{
										bgColor: 'green.400',
									}}
									width={'100%'}
									onClick={handleSave}
								>
									<Text color={'white'}>Save</Text>
								</Button>
							</>
						) : (
							<Button
								// isLoading={isAddingBot}
								bgColor={'green.300'}
								_hover={{
									bgColor: 'green.400',
								}}
								width={'100%'}
								onClick={handleSave}
							>
								<Text color={'white'}>Save</Text>
							</Button>
						)}
					</HStack>
				</Flex>
				<AllResponders />
			</Flex>
		</Flex>
	);
}
