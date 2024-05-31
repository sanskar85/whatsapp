import { AddIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Checkbox,
	Flex,
	FormControl,
	FormLabel,
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
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	VStack,
	useBoolean,
	useToast,
} from '@chakra-ui/react';
import Multiselect from 'multiselect-react-dropdown';
import { useMemo, useState } from 'react';
import { BiRefresh } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import GroupService from '../../../../services/group.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	addGroupReplySaved,
	addGroupReplyUnsaved,
	addMergedGroup,
	addMultipleSelectedGroup,
	addPrivateReplySaved,
	addPrivateReplyUnsaved,
	addSelectedGroup,
	clearEditMergeGroup,
	removeGroupReplySaved,
	removeGroupReplyUnsaved,
	removePrivateReplySaved,
	removePrivateReplyUnsaved,
	removeSelectedGroup,
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
	setPrivateReplySavedAttachments,
	setPrivateReplySavedPolls,
	setPrivateReplySavedSharedContactCards,
	setPrivateReplySavedText,
	setPrivateReplyUnsavedAttachments,
	setPrivateReplyUnsavedPolls,
	setPrivateReplyUnsavedSharedContactCards,
	setPrivateReplyUnsavedText,
	setRestrictedNumbers,
	toggleRandomString,
	toggleReplyBusinessOnly,
	toggleSendToAdmin,
	updateMergeGroupsList,
} from '../../../../store/reducers/MergeGroupReducer';
import { setGroups } from '../../../../store/reducers/UserDetailsReducers';
import AddOns from '../../../components/add-ons';

type GroupMergeProps = {
	onClose: () => void;
	isOpen: boolean;
};

const GroupMerge = ({ onClose, isOpen }: GroupMergeProps) => {
	const dispatch = useDispatch();
	const toast = useToast();
	const [dataRefreshing, groupsLoading] = useBoolean();

	const [searchText, setSearchText] = useState<string>('');

	const { editSelectedGroup } = useSelector((store: StoreState) => store[StoreNames.MERGE_GROUP]);
	const { groups } = useSelector((store: StoreState) => store[StoreNames.USER]);
	const { list: csvList } = useSelector((store: StoreState) => store[StoreNames.CSV]);

	const handleMergeGroup = () => {
		if (editSelectedGroup.name === '') {
			return;
		}
		if (editSelectedGroup.groups.length === 0) {
			return;
		}
		const { id, name, groups } = editSelectedGroup;

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

	const filtered = groups.filter((group) =>
		group.name?.toLowerCase().startsWith(searchText.toLowerCase())
	);

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
							<Flex gap={4}>
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
								<VStack flex={1} justifyContent={'flex-end'} alignItems={'flex-start'} gap={'0'}>
									<Checkbox
										colorScheme='green'
										size='sm'
										isChecked={editSelectedGroup.reply_business_only}
										onChange={() => dispatch(toggleReplyBusinessOnly())}
									>
										Reply Businesses Only
									</Checkbox>
									<Checkbox
										colorScheme='green'
										size='sm'
										isChecked={editSelectedGroup.random_string}
										onChange={() => dispatch(toggleRandomString())}
									>
										Append Random Text
									</Checkbox>
									<Checkbox
										colorScheme='green'
										size='sm'
										isChecked={editSelectedGroup.canSendAdmin}
										onChange={() => dispatch(toggleSendToAdmin())}
									>
										Send to admin
									</Checkbox>
								</VStack>
							</Flex>
						</Box>
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
											<Input
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
											<Input
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
											<Input
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
											<Input
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
							</VStack>
						</Box>

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
			className={'!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full  text-black dark:text-white'}
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

export default GroupMerge;
