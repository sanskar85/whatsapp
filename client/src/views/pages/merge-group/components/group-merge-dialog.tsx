import { AddIcon, CheckIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import {
	AbsoluteCenter,
	Box,
	Button,
	Checkbox,
	Divider,
	Flex,
	FormControl,
	FormLabel,
	Grid,
	GridItem,
	Icon,
	IconButton,
	Input,
	InputGroup,
	InputLeftElement,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Select,
	Table,
	TableContainer,
	Tag,
	TagLabel,
	Tbody,
	Td,
	Text,
	Textarea,
	Th,
	Thead,
	Tr,
	VStack,
	useBoolean,
	useToast,
} from '@chakra-ui/react';
import Multiselect from 'multiselect-react-dropdown';
import { useMemo, useRef, useState } from 'react';
import { BiRefresh, BiTrash } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import { COUNTRIES_OPTIONS as COUNTRIES_OPTIONS_RAW } from '../../../../config/const';
import GroupService from '../../../../services/group.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	addGroupReplySaved,
	addGroupReplyUnsaved,
	addMergedGroup,
	addMultipleSelectedGroup,
	addPrivateReplyAdmin,
	addPrivateReplySaved,
	addPrivateReplyUnsaved,
	addSelectedGroup,
	addTrigger,
	clearEditMergeGroup,
	removeAllTriggers,
	removeGroupReplySaved,
	removeGroupReplyUnsaved,
	removePrivateReplyAdmin,
	removePrivateReplySaved,
	removePrivateReplyUnsaved,
	removeSelectedGroup,
	removeTrigger,
	setAllowedCountryCodes,
	setEndTime,
	setForwardMessage,
	setForwardTo,
	setGroupReplySavedAttachments,
	setGroupReplySavedPolls,
	setGroupReplySavedSharedContactCards,
	setGroupReplySavedText,
	setGroupReplyUnsavedAttachments,
	setGroupReplyUnsavedPolls,
	setGroupReplyUnsavedSharedContactCards,
	setGroupReplyUnsavedText,
	setMaxDelay,
	setMinDelay,
	setName,
	setOptions,
	setPrivateReplyAdminAttachments,
	setPrivateReplyAdminPolls,
	setPrivateReplyAdminSharedContactCards,
	setPrivateReplyAdminText,
	setPrivateReplySavedAttachments,
	setPrivateReplySavedPolls,
	setPrivateReplySavedSharedContactCards,
	setPrivateReplySavedText,
	setPrivateReplyUnsavedAttachments,
	setPrivateReplyUnsavedPolls,
	setPrivateReplyUnsavedSharedContactCards,
	setPrivateReplyUnsavedText,
	setRestrictedNumbers,
	setStartTime,
	setTriggerAtIndex,
	toggleMultipleResponses,
	toggleRandomString,
	toggleReplyBusinessOnly,
	toggleSendToAdmin,
	updateMergeGroupsList,
} from '../../../../store/reducers/MergeGroupReducer';
import { setGroups } from '../../../../store/reducers/UserDetailsReducers';
import AddOns from '../../../components/add-ons';
import Info from '../../../components/info';
import { TextAreaElement, TextInput } from '../../bot/components/Inputs';

type GroupMergeProps = {
	onClose: () => void;
	isOpen: boolean;
};

const COUNTRIES_OPTIONS = COUNTRIES_OPTIONS_RAW.map((country) => ({
	...country,
	name: country.name + ' (+' + country.code + ')',
})).sort((a, b) => a.name.localeCompare(b.name));

const GroupMerge = ({ onClose, isOpen }: GroupMergeProps) => {
	const dispatch = useDispatch();
	const toast = useToast();
	const [dataRefreshing, groupsLoading] = useBoolean();
	const messageRef = useRef<{
		[key: string]: HTMLTextAreaElement | null;
	}>({});

	const [searchText, setSearchText] = useState<string>('');

	const [range, setRange] = useState<{ start: string; end: string }>({
		start: '',
		end: '',
	});

	const { editSelectedGroup, list } = useSelector(
		(store: StoreState) => store[StoreNames.MERGE_GROUP]
	);
	const { groups } = useSelector((store: StoreState) => store[StoreNames.USER]);
	const { list: csvList } = useSelector((store: StoreState) => store[StoreNames.CSV]);

	const handleMergeGroup = () => {
		const { id, name, groups } = editSelectedGroup;
		if (!id && list.some((group) => group.name === editSelectedGroup.name)) {
			toast({
				title: 'Group name already exists',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		if (editSelectedGroup.name === '') {
			toast({
				title: 'Group name cannot be empty',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		if (editSelectedGroup.groups.length === 0) {
			toast({
				title: 'Select at least one group to merge',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		const _editSelectedGroup = {
			...editSelectedGroup,
			group_name: name,
			group_ids: groups,
		};

		const promise = id
			? GroupService.editMergedGroup(id, _editSelectedGroup)
			: GroupService.mergeGroups(_editSelectedGroup);
		toast.promise(promise, {
			success: (data) => {
				const acton = id ? updateMergeGroupsList(data) : addMergedGroup(data);
				dispatch(acton);
				onClose();
				return {
					title: 'Data saved successfully',
				};
			},
			error: {
				title: 'Failed to save data',
			},
			loading: { title: 'Saving Data', description: 'Please wait' },
		});
	};

	const handleSelectGroup = (id: string) => {
		if (editSelectedGroup.groups.includes(id)) {
			dispatch(removeSelectedGroup(id));
		} else {
			dispatch(addSelectedGroup(id));
		}
	};

	const handleClose = () => {
		dispatch(clearEditMergeGroup());
		onClose();
	};

	const handleRefresh = async () => {
		groupsLoading.on();
		const groups = await GroupService.refreshGroups();
		dispatch(setGroups(groups));
		groupsLoading.off();
	};

	const allChecked = useMemo(() => {
		const selectedSet = new Set(editSelectedGroup.groups);
		return groups.every((item) => selectedSet.has(item.id));
	}, [groups, editSelectedGroup.groups]);

	const isIndeterminate = useMemo(() => {
		const selectedSet = new Set(editSelectedGroup.groups);
		return groups.some((item) => selectedSet.has(item.id));
	}, [groups, editSelectedGroup.groups]);

	const handleSelectAll = (allSelected: boolean) => {
		if (allSelected) {
			dispatch(addMultipleSelectedGroup(groups.map((g) => g.id)));
		} else {
			dispatch(addMultipleSelectedGroup([]));
		}
	};

	const insertVariablesToMessage = (key: string, variable: string, targetText: string) => {
		const startIndex = messageRef.current?.[key]?.selectionStart ?? 0;
		const msg = targetText;
		const text = msg.substring(0, startIndex) + ' ' + variable + ' ' + msg.substring(startIndex);
		return text;
	};

	const filtered = groups.filter((group) =>
		group.name?.toLowerCase().startsWith(searchText.toLowerCase())
	);

	const handleSelectRange = () => {
		if (
			Number(range.start) <= 0 ||
			Number(range.end) <= 0 ||
			Number(range.start) >= Number(range.end)
		) {
			toast({
				title: 'Invalid range',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		if (Number(range.end) > groups.length) {
			toast({
				title: 'End range should be less than or equal to total groups',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		if (Number(range.start) > groups.length) {
			toast({
				title: 'Start range should be less than or equal to total groups',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		const selected = groups.slice(Number(range.start) - 1, Number(range.end));
		const selectedIds = selected.map((group) => group.id);
		dispatch(addMultipleSelectedGroup(selectedIds));
		setRange({ start: '', end: '' });
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size={'6xl'} scrollBehavior='inside'>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Merge Group</ModalHeader>
				<ModalBody>
					<VStack alignItems={'stretch'} gap={'0.5rem'}>
						<FormControl>
							<FormLabel>Group Name</FormLabel>
							<Input
								placeholder='Enter Name'
								value={editSelectedGroup.name}
								onChange={(e) => dispatch(setName(e.target.value))}
							/>
						</FormControl>
						<Text fontSize={'large'}>Reply Settings</Text>
						<Box flex={1}>
							<FormControl display={'flex'} flexDirection={'column'} gap={2}>
								<Flex justifyContent={'space-between'} alignItems={'center'}>
									<Box>
										<Text className='text-gray-700 dark:text-gray-400'>Triggers</Text>
										{(editSelectedGroup.options === 'ANYWHERE_MATCH_CASE' ||
											editSelectedGroup.options === 'ANYWHERE_IGNORE_CASE') && (
											<Text className='text-red-500'>
												Spaces in the trigger will be used as delimiter for multiple keywords.
											</Text>
										)}
									</Box>
									<Flex justifyContent={'flex-end'} alignItems={'center'} gap={'1rem'}>
										<IconButton
											isRound={true}
											variant='solid'
											aria-label='Done'
											size='xs'
											icon={
												editSelectedGroup.triggers.length === 0 ? (
													<CheckIcon color='white' />
												) : (
													<></>
												)
											}
											onClick={() => dispatch(removeAllTriggers())}
											className={`${
												editSelectedGroup.triggers.length === 0 ? '!bg-[#4CB072]' : '!bg-[#A6A6A6] '
											} hover:!bg-green-700 `}
										/>
										<Text fontSize='sm' ml={'-0.5rem'}>
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
								{editSelectedGroup.triggers.map((t, index) => (
									<Flex gap={2} key={index}>
										<Textarea
											width={'full'}
											key={index}
											minHeight={'70px'}
											placeholder={`ex. Trigger ${index + 1}`}
											border={'none'}
											className='text-black  !bg-[#ECECEC]'
											_placeholder={{ opacity: 0.4, color: 'inherit' }}
											_focus={{ border: 'none', outline: 'none' }}
											value={t ?? ''}
											onChange={(e) =>
												dispatch(setTriggerAtIndex({ index, value: e.target.value }))
											}
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
								{editSelectedGroup.triggers.length === 0 && (
									<Text textAlign={'center'}>
										No Triggers Added. This bot will run for every message.
									</Text>
								)}
							</FormControl>
						</Box>
						<FormControl flexGrow={1}>
							<Text className='text-gray-700 dark:text-gray-400'>Conditions</Text>
							<SelectElement
								value={editSelectedGroup.options}
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
						</FormControl>

						<FormControl flexGrow={1}>
							<Box className='text-gray-700 dark:text-gray-400'>
								Allowed Country Codes<Info>By default all countries.</Info>
							</Box>
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
									editSelectedGroup.allowed_country_codes.includes(code)
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
						<Box flex={1}>
							<Flex gap={4}>
								<FormControl flex={1}>
									<Text className='text-gray-700 dark:text-gray-400 text-sm'>
										Start At (in IST)
									</Text>
									<Input
										type='time'
										placeholder='00:00'
										rounded={'md'}
										border={'none'}
										className='text-black  !bg-[#ECECEC]'
										_focus={{
											border: 'none',
											outline: 'none',
										}}
										value={editSelectedGroup.start_time}
										onChange={(e) => dispatch(setStartTime(e.target.value))}
									/>
								</FormControl>
								<FormControl flex={1}>
									<Text className='text-gray-700 dark:text-gray-400 text-sm'>End At (in IST)</Text>
									<Input
										type='time'
										placeholder='00:00'
										rounded={'md'}
										border={'none'}
										className='text-black  !bg-[#ECECEC]'
										_focus={{
											border: 'none',
											outline: 'none',
										}}
										value={editSelectedGroup.end_time}
										onChange={(e) => dispatch(setEndTime(e.target.value))}
									/>
								</FormControl>
								<DelayInput
									placeholder='Min Delay (in sec)'
									value={editSelectedGroup.min_delay}
									onChange={(num) => dispatch(setMinDelay(num))}
								/>
								<DelayInput
									placeholder='Max Delay (in sec)'
									value={editSelectedGroup.max_delay}
									onChange={(num) => dispatch(setMaxDelay(num))}
								/>
								<Grid width={'40%'} className='grid-cols-2' mt={'1rem'}>
									<GridItem>
										<Checkbox
											colorScheme='green'
											size='sm'
											isChecked={editSelectedGroup.reply_business_only}
											onChange={() => dispatch(toggleReplyBusinessOnly())}
										>
											Reply Businesses Only
										</Checkbox>
									</GridItem>
									<GridItem>
										<Checkbox
											colorScheme='green'
											size='sm'
											isChecked={editSelectedGroup.random_string}
											onChange={() => dispatch(toggleRandomString())}
										>
											Append Random Text
										</Checkbox>
									</GridItem>
									<GridItem>
										<Checkbox
											colorScheme='green'
											size='sm'
											isChecked={editSelectedGroup.canSendAdmin}
											onChange={() => dispatch(toggleSendToAdmin())}
										>
											Send to admin
										</Checkbox>
									</GridItem>
									<GridItem>
										<Checkbox
											colorScheme='green'
											size='sm'
											isChecked={!editSelectedGroup.multiple_responses}
											onChange={() => dispatch(toggleMultipleResponses())}
										>
											Only Reply Once
										</Checkbox>
									</GridItem>
								</Grid>
							</Flex>
						</Box>
						<Flex direction={'column'} gap={2} mt={'1rem'}>
							<Box position='relative'>
								<Divider height='2px' />
								<AbsoluteCenter px='4'>Forward Leads</AbsoluteCenter>
							</Box>
							<Box flex={1} mt={'0.5rem'}>
								<Text>Forward To (without +)</Text>
								<TextInput
									onlyLightMode
									placeholder='ex 9175XXXXXX68'
									value={editSelectedGroup.forward.number ?? ''}
									onChangeText={(text) => dispatch(setForwardTo(text))}
								/>
							</Box>

							<Box flex={1}>
								<Text>Forward Message</Text>
								<TextAreaElement
									onlyLightMode
									value={editSelectedGroup.forward.message ?? ''}
									onChange={(e) => dispatch(setForwardMessage(e.target.value))}
									isInvalid={false}
									placeholder={'ex. Forwarded Lead'}
								/>
							</Box>
						</Flex>
						<Box>
							<Text>Restricted Numbers</Text>
							<Flex direction={'column'} gap={2}>
								<Multiselect
									selectedValues={csvList.filter((csv) =>
										editSelectedGroup.restricted_numbers.includes(csv.id)
									)}
									displayValue='name'
									placeholder={'Select restricted list'}
									onRemove={(selectedList: { id: string }[]) =>
										dispatch(setRestrictedNumbers(selectedList.map((csv) => csv.id)))
									}
									onSelect={(selectedList: { id: string }[]) => {
										dispatch(setRestrictedNumbers(selectedList.map((csv) => csv.id)));
									}}
									showCheckbox={true}
									options={csvList}
									style={{
										searchBox: {
											border: 'none',
										},
										inputField: {
											width: '100%',
										},
									}}
									className='  bg-[#ECECEC] rounded-md border-none '
								/>
							</Flex>
						</Box>

						<Box width={'full'}>
							<VStack width={'full'} alignItems={'stretch'}>
								<Flex className='flex-col gap-2 p-2 border-2 border-gray-400 rounded-lg'>
									<Flex justifyContent={'space-between'}>
										Saved In-Chat Reply{' '}
										<IconButton
											icon={<AddIcon />}
											aria-label='add-icon'
											onClick={() => dispatch(addGroupReplySaved())}
										/>
									</Flex>
									{editSelectedGroup.group_reply_saved.map((group, index) => (
										<VStack key={index} alignItems={'stretch'} gap={'1rem'}>
											<Flex justifyContent={'space-between'}>
												<Text fontWeight={'semibold'} mb={'-1.0rem'}>
													Message {index + 1}
												</Text>
												<IconButton
													icon={<DeleteIcon />}
													aria-label='minus-icon'
													size={'sm'}
													colorScheme='orange'
													onClick={() => dispatch(removeGroupReplySaved(index))}
												/>
											</Flex>
											<FormControl>
												<FormLabel>Text</FormLabel>
												<Textarea
													ref={(el) => (messageRef.current['group-saved'] = el)}
													width={'full'}
													size={'sm'}
													rounded={'md'}
													placeholder={'eg. Hello there!'}
													border={'none'}
													className='text-black !bg-[#ECECEC] '
													_placeholder={{
														opacity: 0.4,
														color: 'inherit',
													}}
													_focus={{ border: 'none', outline: 'none' }}
													value={group.text ?? ''}
													onChange={(e) =>
														dispatch(setGroupReplySavedText({ index, text: e.target.value }))
													}
												/>
											</FormControl>

											<PublicNameTag
												onClick={() => {
													const text = insertVariablesToMessage(
														'group-saved',
														'{{public_name}}',
														group.text ?? ''
													);
													dispatch(setGroupReplySavedText({ index, text }));
												}}
											/>
											<Box>
												<AddOns
													attachments={group.attachments}
													shared_contact_cards={group.shared_contact_cards}
													polls={group.polls}
													onAttachmentsSelected={(ids) =>
														dispatch(setGroupReplySavedAttachments({ text: ids, index }))
													}
													onContactsSelected={(ids) =>
														dispatch(setGroupReplySavedSharedContactCards({ text: ids, index }))
													}
													onPollsSelected={(ids) =>
														dispatch(setGroupReplySavedPolls({ polls: ids, index }))
													}
												/>
											</Box>
										</VStack>
									))}
								</Flex>
								<Flex className='flex-col gap-2 p-2 border-2 border-gray-400 rounded-lg'>
									<Flex justifyContent={'space-between'}>
										Unsaved In-Chat Reply{' '}
										<IconButton
											icon={<AddIcon />}
											aria-label='add-icon'
											onClick={() => dispatch(addGroupReplyUnsaved())}
										/>
									</Flex>

									{editSelectedGroup.group_reply_unsaved.map((group, index) => (
										<VStack key={index} alignItems={'stretch'} gap={'1rem'}>
											<Flex justifyContent={'space-between'}>
												<Text fontWeight={'semibold'} mb={'-1.0rem'}>
													Message {index + 1}
												</Text>
												<IconButton
													icon={<DeleteIcon />}
													aria-label='minus-icon'
													size={'sm'}
													colorScheme='orange'
													onClick={() => dispatch(removeGroupReplyUnsaved(index))}
												/>
											</Flex>
											<FormControl>
												<FormLabel>Text</FormLabel>
												<Textarea
													ref={(el) => (messageRef.current['group-unsaved'] = el)}
													width={'full'}
													size={'sm'}
													rounded={'md'}
													placeholder={'eg. Hello there!'}
													border={'none'}
													className='text-black !bg-[#ECECEC] '
													_placeholder={{
														opacity: 0.4,
														color: 'inherit',
													}}
													_focus={{ border: 'none', outline: 'none' }}
													value={group.text ?? ''}
													onChange={(e) =>
														dispatch(setGroupReplyUnsavedText({ index, text: e.target.value }))
													}
												/>
											</FormControl>
											<PublicNameTag
												onClick={() => {
													const text = insertVariablesToMessage(
														'group-unsaved',
														'{{public_name}}',
														group.text ?? ''
													);
													dispatch(setGroupReplyUnsavedText({ index, text }));
												}}
											/>
											<Box>
												<AddOns
													attachments={group.attachments}
													shared_contact_cards={group.shared_contact_cards}
													polls={group.polls}
													onAttachmentsSelected={(ids) =>
														dispatch(setGroupReplyUnsavedAttachments({ text: ids, index }))
													}
													onContactsSelected={(ids) =>
														dispatch(setGroupReplyUnsavedSharedContactCards({ text: ids, index }))
													}
													onPollsSelected={(ids) =>
														dispatch(setGroupReplyUnsavedPolls({ polls: ids, index }))
													}
												/>
											</Box>
										</VStack>
									))}
								</Flex>
								<Flex className='flex-col gap-2 p-2 border-2 border-gray-400 rounded-lg'>
									<Flex justifyContent={'space-between'}>
										Saved Private Reply{' '}
										<IconButton
											icon={<AddIcon />}
											aria-label='add-icon'
											onClick={() => dispatch(addPrivateReplySaved())}
										/>
									</Flex>

									{editSelectedGroup.private_reply_saved.map((group, index) => (
										<VStack key={index} alignItems={'stretch'} gap={'1rem'}>
											<Flex justifyContent={'space-between'}>
												<Text fontWeight={'semibold'} mb={'-1.0rem'}>
													Message {index + 1}
												</Text>
												<IconButton
													icon={<DeleteIcon />}
													aria-label='minus-icon'
													size={'sm'}
													colorScheme='orange'
													onClick={() => dispatch(removePrivateReplySaved(index))}
												/>
											</Flex>
											<FormControl>
												<FormLabel>Text</FormLabel>
												<Textarea
													ref={(el) => (messageRef.current['private-saved'] = el)}
													width={'full'}
													size={'sm'}
													rounded={'md'}
													placeholder={'eg. Hello there!'}
													border={'none'}
													className='text-black !bg-[#ECECEC] '
													_placeholder={{
														opacity: 0.4,
														color: 'inherit',
													}}
													_focus={{ border: 'none', outline: 'none' }}
													value={group.text ?? ''}
													onChange={(e) =>
														dispatch(setPrivateReplySavedText({ index, text: e.target.value }))
													}
												/>
											</FormControl>
											<PublicNameTag
												onClick={() => {
													const text = insertVariablesToMessage(
														'private-saved',
														'{{public_name}}',
														group.text ?? ''
													);
													dispatch(setPrivateReplySavedText({ index, text }));
												}}
											/>
											<Box>
												<AddOns
													attachments={group.attachments}
													shared_contact_cards={group.shared_contact_cards}
													polls={group.polls}
													onAttachmentsSelected={(ids) =>
														dispatch(setPrivateReplySavedAttachments({ text: ids, index }))
													}
													onContactsSelected={(ids) =>
														dispatch(setPrivateReplySavedSharedContactCards({ text: ids, index }))
													}
													onPollsSelected={(ids) =>
														dispatch(setPrivateReplySavedPolls({ polls: ids, index }))
													}
												/>
											</Box>
										</VStack>
									))}
								</Flex>
								<Flex className='flex-col gap-2 p-2 border-2 border-gray-400 rounded-lg'>
									<Flex justifyContent={'space-between'}>
										Unsaved Private Reply{' '}
										<IconButton
											icon={<AddIcon />}
											aria-label='add-icon'
											onClick={() => dispatch(addPrivateReplyUnsaved())}
										/>
									</Flex>

									{editSelectedGroup.private_reply_unsaved.map((group, index) => (
										<VStack key={index} alignItems={'stretch'} gap={'1rem'}>
											<Flex justifyContent={'space-between'}>
												<Text fontWeight={'semibold'} mb={'-1.0rem'}>
													Message {index + 1}
												</Text>
												<IconButton
													icon={<DeleteIcon />}
													aria-label='minus-icon'
													size={'sm'}
													colorScheme='orange'
													onClick={() => dispatch(removePrivateReplyUnsaved(index))}
												/>
											</Flex>

											<FormControl>
												<FormLabel>Text</FormLabel>
												<Textarea
													ref={(el) => (messageRef.current['private-unsaved'] = el)}
													width={'full'}
													size={'sm'}
													rounded={'md'}
													placeholder={'eg. Hello there!'}
													border={'none'}
													className='text-black !bg-[#ECECEC] '
													_placeholder={{
														opacity: 0.4,
														color: 'inherit',
													}}
													_focus={{ border: 'none', outline: 'none' }}
													value={group.text ?? ''}
													onChange={(e) =>
														dispatch(setPrivateReplyUnsavedText({ index, text: e.target.value }))
													}
												/>
											</FormControl>
											<PublicNameTag
												onClick={() => {
													const text = insertVariablesToMessage(
														'private-unsaved',
														'{{public_name}}',
														group.text ?? ''
													);
													dispatch(setPrivateReplyUnsavedText({ index, text }));
												}}
											/>
											<Box>
												<AddOns
													attachments={group.attachments}
													shared_contact_cards={group.shared_contact_cards}
													polls={group.polls}
													onAttachmentsSelected={(ids) =>
														dispatch(setPrivateReplyUnsavedAttachments({ text: ids, index }))
													}
													onContactsSelected={(ids) =>
														dispatch(setPrivateReplyUnsavedSharedContactCards({ text: ids, index }))
													}
													onPollsSelected={(ids) =>
														dispatch(setPrivateReplyUnsavedPolls({ polls: ids, index }))
													}
												/>
											</Box>
										</VStack>
									))}
								</Flex>
								<Flex className='flex-col gap-2 p-2 border-2 border-gray-400 rounded-lg'>
									<Flex justifyContent={'space-between'}>
										Private Reply Admin{' '}
										<IconButton
											icon={<AddIcon />}
											aria-label='add-icon'
											onClick={() => dispatch(addPrivateReplyAdmin())}
										/>
									</Flex>

									{editSelectedGroup.private_reply_admin.map((group, index) => (
										<VStack key={index} alignItems={'stretch'} gap={'1rem'}>
											<Flex justifyContent={'space-between'}>
												<Text fontWeight={'semibold'} mb={'-1.0rem'}>
													Message {index + 1}
												</Text>
												<IconButton
													icon={<DeleteIcon />}
													aria-label='minus-icon'
													size={'sm'}
													colorScheme='orange'
													onClick={() => dispatch(removePrivateReplyAdmin(index))}
												/>
											</Flex>
											<FormControl>
												<FormLabel>Text</FormLabel>
												<Textarea
													ref={(el) => (messageRef.current['private-admin'] = el)}
													width={'full'}
													size={'sm'}
													rounded={'md'}
													placeholder={'eg. Hello there!'}
													border={'none'}
													className='text-black !bg-[#ECECEC] '
													_placeholder={{
														opacity: 0.4,
														color: 'inherit',
													}}
													_focus={{ border: 'none', outline: 'none' }}
													value={group.text ?? ''}
													onChange={(e) =>
														dispatch(setPrivateReplyAdminText({ index, text: e.target.value }))
													}
												/>
											</FormControl>
											<Flex>
												<Tag
													size={'sm'}
													m={'0.25rem'}
													p={'0.5rem'}
													width={'fit-content'}
													borderRadius='md'
													variant='solid'
													colorScheme='gray'
													_hover={{ cursor: 'pointer' }}
													onClick={() => {
														const text = insertVariablesToMessage(
															'private-admin',
															'{{admin_name}}',
															group.text ?? ''
														);
														dispatch(setPrivateReplyAdminText({ index, text }));
													}}
												>
													<TagLabel>{'{{admin_name}}'}</TagLabel>
												</Tag>
												<Tag
													size={'sm'}
													m={'0.25rem'}
													p={'0.5rem'}
													width={'fit-content'}
													borderRadius='md'
													variant='solid'
													colorScheme='gray'
													_hover={{ cursor: 'pointer' }}
													onClick={() => {
														const text = insertVariablesToMessage(
															'private-admin',
															'{{group_name}}',
															group.text ?? ''
														);
														dispatch(setPrivateReplyAdminText({ index, text }));
													}}
												>
													<TagLabel>{'{{group_name}}'}</TagLabel>
												</Tag>
												<Tag
													size={'sm'}
													m={'0.25rem'}
													p={'0.5rem'}
													width={'fit-content'}
													borderRadius='md'
													variant='solid'
													colorScheme='gray'
													_hover={{ cursor: 'pointer' }}
													onClick={() => {
														const text = insertVariablesToMessage(
															'private-admin',
															'{{sender_number}}',
															group.text ?? ''
														);
														dispatch(setPrivateReplyAdminText({ index, text }));
													}}
												>
													<TagLabel>{'{{sender_number}}'}</TagLabel>
												</Tag>
												<Tag
													size={'sm'}
													m={'0.25rem'}
													p={'0.5rem'}
													width={'fit-content'}
													borderRadius='md'
													variant='solid'
													colorScheme='gray'
													_hover={{ cursor: 'pointer' }}
													onClick={() => {
														const text = insertVariablesToMessage(
															'private-admin',
															'{{timestamp}}',
															group.text ?? ''
														);
														dispatch(setPrivateReplyAdminText({ index, text }));
													}}
												>
													<TagLabel>{'{{timestamp}}'}</TagLabel>
												</Tag>
											</Flex>
											<Box>
												<AddOns
													attachments={group.attachments}
													shared_contact_cards={group.shared_contact_cards}
													polls={group.polls}
													onAttachmentsSelected={(ids) =>
														dispatch(setPrivateReplyAdminAttachments({ text: ids, index }))
													}
													onContactsSelected={(ids) =>
														dispatch(setPrivateReplyAdminSharedContactCards({ text: ids, index }))
													}
													onPollsSelected={(ids) =>
														dispatch(setPrivateReplyAdminPolls({ polls: ids, index }))
													}
												/>
											</Box>
										</VStack>
									))}
								</Flex>
							</VStack>
						</Box>
						<Box>
							<Text>Select Group Range</Text>
						</Box>
						<Flex gap={2}>
							<Box flex={1}>
								<Input
									onChange={(e) =>
										setRange((prev) => {
											return {
												...prev,
												start: e.target.value,
											};
										})
									}
									value={range.start}
									type='number'
									placeholder='Start Range'
								/>
							</Box>
							<Box flex={1}>
								<Input
									onChange={(e) =>
										setRange((prev) => {
											return {
												...prev,
												end: e.target.value,
											};
										})
									}
									value={range.end}
									type='number'
									placeholder='End Range'
								/>
							</Box>
							<Button flex={1} colorScheme='green' onClick={handleSelectRange}>
								Select range
							</Button>
						</Flex>
						<TableContainer>
							<Table>
								<Thead>
									<Tr>
										<Th width={'2%'}>
											<Checkbox
												isChecked={allChecked}
												isIndeterminate={isIndeterminate && !allChecked}
												onChange={(e) => handleSelectAll(e.target.checked)}
											/>
										</Th>
										<Th>
											<Flex
												alignItems={'center'}
												justifyContent={'space-between'}
												direction={'row'}
											>
												<Text>Name</Text>
												<InputGroup size='sm' variant={'outline'} width={'250px'}>
													<InputLeftElement pointerEvents='none'>
														<SearchIcon color='gray.300' />
													</InputLeftElement>
													<Input
														placeholder='Search here...'
														value={searchText}
														onChange={(e) => setSearchText(e.target.value)}
														borderRadius={'5px'}
														focusBorderColor='gray.300'
													/>
												</InputGroup>
											</Flex>
										</Th>
									</Tr>
								</Thead>
								<Tbody>
									{filtered.map((group, index) => {
										if (!group.isMergedGroup)
											return (
												<Tr key={index}>
													<Td>
														<Checkbox
															isChecked={editSelectedGroup.groups.includes(group.id)}
															onChange={() => handleSelectGroup(group.id)}
															mr={'0.5rem'}
														/>
														{index + 1}
													</Td>
													<Td>{group.name}</Td>
												</Tr>
											);
									})}
								</Tbody>
							</Table>
						</TableContainer>
					</VStack>
				</ModalBody>

				<ModalFooter>
					<Flex width={'full'} justifyContent={'space-between'} alignItems={'center'}>
						<IconButton
							aria-label='delete'
							icon={<Icon as={BiRefresh} height={6} width={6} />}
							colorScheme={'blue'}
							size={'sm'}
							isLoading={dataRefreshing}
							onClick={handleRefresh}
						/>
						<Flex>
							<Button colorScheme='red' mr={3} onClick={handleClose}>
								Cancel
							</Button>
							<Button colorScheme='green' onClick={handleMergeGroup}>
								{editSelectedGroup.id ? 'Save' : 'Merge'}
							</Button>
						</Flex>
					</Flex>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export function NumberInput({
	value,
	onChangeText,
}: {
	value: number;
	onChangeText: (value: number) => void;
}) {
	return (
		<Input
			type='number'
			placeholder='10'
			size={'md'}
			rounded={'md'}
			border={'none'}
			className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
			_focus={{
				border: 'none',
				outline: 'none',
			}}
			value={value}
			onChange={(e) => onChangeText(Number(e.target.value))}
		/>
	);
}

export function SelectElement({
	options,
	value,
	onChangeText,
	size = 'md',
}: {
	options: { title: string; value: string }[];
	value: string;
	onChangeText: (text: string) => void;
	size?: string;
}) {
	return (
		<Select
			className={'!bg-[#ECECEC]  rounded-md w-full  text-black '}
			border={'none'}
			value={value}
			rounded={'md'}
			size={size}
			onChange={(e) => onChangeText(e.target.value)}
		>
			{options.map((option, index) => (
				<option
					key={index}
					className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
					value={option.value}
				>
					{option.title}
				</option>
			))}
		</Select>
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
		<FormControl flex={1} isInvalid={invalid}>
			<Text fontSize='sm' className='text-gray-700'>
				{placeholder}
			</Text>
			<Input
				width={'full'}
				placeholder='5'
				rounded={'md'}
				border={'none'}
				className='text-black  !bg-[#ECECEC] '
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

function PublicNameTag({ onClick }: { onClick: () => void }) {
	return (
		<Tag
			size={'sm'}
			m={'0.25rem'}
			p={'0.5rem'}
			width={'fit-content'}
			borderRadius='md'
			variant='solid'
			colorScheme='gray'
			_hover={{ cursor: 'pointer' }}
			onClick={onClick}
		>
			<TagLabel>{'{{public_name}}'}</TagLabel>
		</Tag>
	);
}

export default GroupMerge;
