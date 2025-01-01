import { AddIcon, CheckIcon } from '@chakra-ui/icons';
import {
	AbsoluteCenter,
	Box,
	Button,
	Checkbox,
	Divider,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	HStack,
	IconButton,
	Input,
	Switch,
	Tag,
	TagLabel,
	Text,
	Textarea,
	useDisclosure,
	useToast,
} from '@chakra-ui/react';
import Multiselect from 'multiselect-react-dropdown';
import { useEffect, useRef, useState } from 'react';
import { BiTrash } from 'react-icons/bi';
import { RiRobot2Line } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { COUNTRIES_OPTIONS as COUNTRIES_OPTIONS_RAW, NAVIGATION } from '../../../config/const';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import BotService from '../../../services/bot.service';
import { StoreNames, StoreState } from '../../../store';
import {
	addBot,
	addTrigger,
	removeAllTriggers,
	removeTrigger,
	reset,
	setAddingBot,
	setAllowedCountryCodes,
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
	setRecipient,
	setResponseDelayTime,
	setResponseDelayType,
	setStartAt,
	setTriggerAtIndex,
	setTriggerGapTime,
	setTriggerGapType,
	toggleRandomString,
	updateBot,
} from '../../../store/reducers/BotReducers';
import AddOns from '../../components/add-ons';
import CheckButton from '../../components/check-button';
import Info from '../../components/info';
import NumberInputDialog from '../../components/number-input-dialog';
import { AddDevicePopup, SubscriptionPopup } from '../../components/subscription-alert';
import AllResponders from './components/AllResponders';
import { NumberInput, SelectElement, TextAreaElement, TextInput } from './components/Inputs';

const COUNTRIES_OPTIONS = COUNTRIES_OPTIONS_RAW.map((country) => ({
	...country,
	name: country.name + ' (+' + country.code + ')',
})).sort((a, b) => a.name.localeCompare(b.name));

export default function Bot() {
	const dispatch = useDispatch();
	const theme = useTheme();
	const toast = useToast();
	const messageRef = useRef(0);

	const {
		isOpen: isIncludeNumberInputOpen,
		onClose: closeIncludeNumberInput,
		onOpen: openIncludeNumberInput,
	} = useDisclosure();

	const {
		isOpen: isExcludeNumberInputOpen,
		onClose: closeExcludeNumberInput,
		onOpen: openExcludeNumberInput,
	} = useDisclosure();

	const [isAlertMessage, setIsAlertMessage] = useState(false);
	const [readMoreDetails, setReadMoreDetails] = useState({
		title: '',
		message: '',
	});

	const { details, trigger_gap, response_delay, ui } = useSelector(
		(state: StoreState) => state[StoreNames.CHATBOT]
	);
	const {
		trigger,
		message,
		options,
		recipient,
		shared_contact_cards,
		attachments,
		response_delay_seconds,
		trigger_gap_seconds,
		forward,
		allowed_country_codes,
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

		if (isAlertMessage) {
			if (
				!readMoreDetails.title &&
				attachments.length === 0 &&
				shared_contact_cards.length === 0 &&
				details.polls.length === 0
			) {
				errorPayload.type = 'messageError';
				errorPayload.error = 'Title is required';
				dispatch(setError(errorPayload));
				notHasError = false;
			} else {
				errorPayload.type = 'messageError';
				errorPayload.error = '';
				dispatch(setError(errorPayload));
			}

			if (
				!readMoreDetails.message &&
				attachments.length === 0 &&
				shared_contact_cards.length === 0 &&
				details.polls.length === 0
			) {
				errorPayload.type = 'messageError';
				errorPayload.error = 'Message is required';
				dispatch(setError(errorPayload));
				notHasError = false;
			} else {
				errorPayload.type = 'messageError';
				errorPayload.error = '';
				dispatch(setError(errorPayload));
			}
		} else {
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

	const handleReadMoreInput = (type: string, value: string) => {
		setReadMoreDetails((prev) => ({
			...prev,
			[type]: value,
		}));
	};

	async function handleSave() {
		if (!validate()) {
			return;
		}
		if (isEditingBot && !details.bot_id) return;
		const _details = {
			...details,
			message: isAlertMessage
				? readMoreDetails.title + '\n' + '\u200B'.repeat(4000) + readMoreDetails.message
				: message,
		};
		dispatch(setAddingBot(true));
		const promise = isEditingBot
			? BotService.updateBot(details.bot_id, _details)
			: BotService.createBot(_details);

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
							<div>
								<Text className='text-gray-700 dark:text-gray-400'>Triggers</Text>
								{(options === 'ANYWHERE_MATCH_CASE' || options === 'ANYWHERE_IGNORE_CASE') && (
									<Text className='text-red-500'>
										Spaces in the trigger will be used as delimiter for multiple keywords.
									</Text>
								)}
							</div>
							<Flex justifyContent={'flex-end'} alignItems={'center'} gap={'1rem'}>
								<IconButton
									isRound={true}
									variant='solid'
									aria-label='Done'
									size='xs'
									icon={trigger.length === 0 ? <CheckIcon color='white' /> : <></>}
									onClick={() => dispatch(removeAllTriggers())}
									className={`${
										trigger.length === 0 ? '!bg-[#4CB072]' : '!bg-[#A6A6A6] '
									} hover:!bg-green-700 `}
								/>
								<Text fontSize='sm' ml={'-0.5rem'} color={theme === 'dark' ? 'white' : 'black'}>
									Default Message
								</Text>
								<Button
									variant='solid'
									colorScheme='green'
									leftIcon={<AddIcon color='white' />}
									onClick={() => dispatch(addTrigger())}
								>
									<Text fontSize='sm'>Add Trigger</Text>
								</Button>
							</Flex>
						</Flex>
						{trigger.map((t, index) => (
							<Flex gap={2}>
								<TextAreaElement
									key={index}
									value={t ?? ''}
									onChange={(e) => dispatch(setTriggerAtIndex({ index, value: e.target.value }))}
									isInvalid={!!ui.triggerError}
									placeholder={`ex. Trigger ${index + 1}`}
								/>
								<IconButton
									colorScheme='red'
									aria-label='delete trigger'
									icon={<BiTrash />}
									onClick={() => dispatch(removeTrigger(index))}
									className='rounded-md'
								/>
							</Flex>
						))}
						{trigger.length === 0 && (
							<Text textAlign={'center'} color={theme === 'dark' ? 'gray.200' : 'gray.800'}>
								No Triggers Added. This bot will run for every message.
							</Text>
						)}
						{ui.triggerError && <FormErrorMessage>{ui.triggerError}</FormErrorMessage>}
					</FormControl>

					{/*--------------------------------- RECIPIENTS SECTION--------------------------- */}

					<Flex gap={4}>
						<Flex direction={'column'}>
							<Text className='text-gray-700 dark:text-gray-400'>Recipients</Text>
							<Flex width={'full'} alignItems={'center'} justifyContent={'space-between'} gap={4}>
								<Flex className='gap-2'>
									<CheckButton
										gap={2}
										label='Saved'
										name='Saved'
										onChange={({ value }) => dispatch(setRecipient({ saved: value }))}
										value={recipient.saved}
									/>
								</Flex>
								<Flex className='gap-2'>
									<CheckButton
										gap={2}
										label='Unsaved'
										name='Unsaved'
										onChange={({ value }) => dispatch(setRecipient({ unsaved: value }))}
										value={recipient.unsaved}
									/>
								</Flex>

								<Flex gap={2}>
									<Button fontWeight={'normal'} onClick={openIncludeNumberInput}>
										Include({recipient.include.length})
									</Button>
									<NumberInputDialog
										numbers={recipient.include}
										onConfirm={(numbers) => dispatch(setRecipient({ include: numbers }))}
										isOpen={isIncludeNumberInputOpen}
										onClose={closeIncludeNumberInput}
									/>
									<Button fontWeight={'normal'} onClick={openExcludeNumberInput}>
										Exclude({recipient.exclude.length})
									</Button>
									<NumberInputDialog
										numbers={recipient.exclude}
										onConfirm={(numbers) => dispatch(setRecipient({ exclude: numbers }))}
										isOpen={isExcludeNumberInputOpen}
										onClose={closeExcludeNumberInput}
									/>
								</Flex>
							</Flex>
						</Flex>

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
									{
										value: 'ANYWHERE_MATCH_CASE',
										title: 'Anywhere Match Case',
									},
									{
										value: 'ANYWHERE_IGNORE_CASE',
										title: 'Anywhere Ignore Case',
									},
								]}
							/>
							{ui.optionsError && <FormErrorMessage>{ui.optionsError}</FormErrorMessage>}
						</FormControl>
						<FormControl isInvalid={!!ui.optionsError} flexGrow={1}>
							<Text className='text-gray-700 dark:text-gray-400'>
								Allowed Country Codes <Info>By default all countries.</Info>
							</Text>
							<Multiselect
								displayValue='name'
								placeholder='Select Country'
								onRemove={(selectedList) =>
									dispatch(
										setAllowedCountryCodes(
											selectedList.map((country: { code: string }) => country.code)
										)
									)
								}
								onSelect={(selectedList) => {
									dispatch(
										setAllowedCountryCodes(
											selectedList.map((country: { code: string }) => country.code)
										)
									);
								}}
								showCheckbox={true}
								selectedValues={COUNTRIES_OPTIONS.filter(({ code }) =>
									allowed_country_codes.includes(code)
								)}
								options={COUNTRIES_OPTIONS}
								style={{
									searchBox: {
										border: 'none',
									},
								}}
								className='text-black !bg-[#ECECEC]  rounded-md border-none '
							/>
						</FormControl>
					</Flex>

					{/*--------------------------------- MESSAGE SECTION--------------------------- */}
					<FormControl display={'flex'} mt={'1rem'}>
						<FormLabel className='dark:text-gray-400' mb={0}>
							Read more
						</FormLabel>
						<Switch
							colorScheme='green'
							checked={isAlertMessage}
							onChange={(e) => setIsAlertMessage(e.target.checked)}
						/>
					</FormControl>
					<Box hidden={!isAlertMessage}>
						<FormControl>
							<FormLabel className='dark:text-gray-400'>Title</FormLabel>
							<TextAreaElement
								onChange={(e) => handleReadMoreInput('title', e.target.value)}
								placeholder='eg. ALERT'
								value={readMoreDetails.title}
								isInvalid={!!ui.messageError}
							/>
						</FormControl>
						<FormControl>
							<FormLabel className='dark:text-gray-400'>Message</FormLabel>
							<TextAreaElement
								onChange={(e) => handleReadMoreInput('message', e.target.value)}
								placeholder='eg. You are invited to fanfest'
								value={readMoreDetails.message}
								isInvalid={!!ui.messageError}
							/>
						</FormControl>
					</Box>

					<FormControl hidden={isAlertMessage} isInvalid={!!ui.messageError}>
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
								className='dark:text-white'
							>
								Append Random Text
							</Checkbox>
						</HStack>
					</FormControl>

					<HStack alignItems={'start'}>
						{/*--------------------------------- GAP & DELAY SECTION--------------------------- */}

						<FormControl isInvalid={!!ui.triggerGapError} flex={1}>
							<Flex alignItems={'center'}>
								<Text className='text-gray-700 dark:text-gray-400'>
									Gap Delay<Info>Time Gap if same trigger is sent.</Info>
								</Text>
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
								<Text className='text-gray-700 dark:text-gray-400'>
									Message Delay<Info>Time Delay between trigger and response.</Info>
								</Text>
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
