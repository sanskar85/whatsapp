import { SearchIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Checkbox,
	Divider,
	Flex,
	HStack,
	Input,
	InputGroup,
	InputLeftElement,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	useDisclosure,
	useToast,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EnhancementService from '../../../../services/enhancements.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	setSavedMimeType,
	setSavedNumberExclude,
	setSavedNumberInclude,
	setUnsavedMimeType,
	setUnsavedNumberExclude,
	setUnsavedNumberInclude,
} from '../../../../store/reducers/EnhancementsReducers';
import NumberInputDialog from '../../../components/number-input-dialog';
import MimeSelector from './mime-type-selector';
import GroupsRuleDialog from './rule-dialog';

type MessageLoggingDialogProps = {
	isOpen: boolean;
	onClose: () => void;
};

const MessageLoggingDialog = ({ isOpen, onClose }: MessageLoggingDialogProps) => {
	const toast = useToast();

	const { logger_prefs } = useSelector((state: StoreState) => state[StoreNames.ENHANCEMENT]);

	const dispatch = useDispatch();

	const [group_id, setGroupId] = useState<string[]>([]);

	const [range, setRange] = useState<{ start: string; end: string }>({
		start: '',
		end: '',
	});

	const [searchText, setSearchText] = useState<string>('');

	const {
		isOpen: isSavedIncludeNumberInputOpen,
		onClose: closeSavedIncludeNumberInput,
		onOpen: openSavedIncludeNumberInput,
	} = useDisclosure();

	const {
		isOpen: isUnsavedIncludeNumberInputOpen,
		onClose: closeUnsavedIncludeNumberInput,
		onOpen: openUnsavedIncludeNumberInput,
	} = useDisclosure();

	const {
		isOpen: isSavedExcludeNumberInputOpen,
		onClose: closeSavedExcludeNumberInput,
		onOpen: openSavedExcludeNumberInput,
	} = useDisclosure();

	const {
		isOpen: isUnsavedExcludeNumberInputOpen,
		onClose: closeUnsavedExcludeNumberInput,
		onOpen: openUnsavedExcludeNumberInput,
	} = useDisclosure();

	const {
		isOpen: isNewRuleOpen,
		onClose: closeNewRuleInput,
		onOpen: openNewRuleInput,
	} = useDisclosure();

	const groups = Object.values(logger_prefs).filter(
		(group) => group.id !== 'saved' && group.id !== 'unsaved'
	);

	const filteredGroups = groups.filter((group) =>
		group.name?.toLowerCase().startsWith(searchText.toLowerCase())
	);

	const updatePreferences = () => {
		toast.promise(
			EnhancementService.updateMessageLoggerPreferences({
				id: 'saved',
				include: logger_prefs.saved.include,
				exclude: logger_prefs.saved.exclude,
				loggers: logger_prefs.saved.loggers,
			}),
			{
				loading: {
					title: 'Updating saved preferences',
				},
				success: (res) => {
					if (!res) {
						return {
							title: 'Error updating saved preferences',
							duration: 3000,
						};
					}
					return {
						title: 'Saved preferences updated',
						duration: 3000,
					};
				},
				error: {
					title: 'Error updating saved preferences',
					duration: 3000,
				},
			}
		);
	};

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
		if (Number(range.end) > filteredGroups.length) {
			toast({
				title: 'End range should be less than or equal to total groups',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		if (Number(range.start) > filteredGroups.length) {
			toast({
				title: 'Start range should be less than or equal to total groups',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		const selected = filteredGroups.slice(Number(range.start) - 1, Number(range.end));
		const selectedIds = selected.map((group) => group.id);
		setGroupId(selectedIds);
		setRange({ start: '', end: '' });
	};

	const allChecked = useMemo(() => {
		const selectedSet = new Set(group_id);
		return filteredGroups.every((item) => selectedSet.has(item.id));
	}, [group_id, filteredGroups]);

	const isIndeterminate = useMemo(() => {
		const selectedSet = new Set(group_id);
		return filteredGroups.some((item) => selectedSet.has(item.id));
	}, [group_id, filteredGroups]);

	const handleSelectAll = (allSelected: boolean) => {
		if (allSelected) {
			setGroupId(filteredGroups.map((g) => g.id));
		} else {
			setGroupId([]);
		}
	};

	const handleSelectGroup = (id: string) => {
		if (group_id.includes(id)) {
			setGroupId(group_id.filter((group) => group !== id));
		} else {
			setGroupId([...group_id, id]);
		}
	};

	return (
		<>
			<Modal isOpen={isOpen} onClose={onClose} size={'6xl'} scrollBehavior='inside'>
				<ModalOverlay />
				<ModalContent minHeight={'50vh'}>
					<ModalHeader>Message logging rules</ModalHeader>
					<ModalBody>
						<Box>
							<Flex width={'full'} alignItems={'start'} justifyContent={'space-between'} gap={4}>
								<Text flex={1}>Saved Contacts</Text>
								<Box flex={1}>
									<MimeSelector
										onChange={(value) => {
											dispatch(setSavedMimeType(value));
										}}
										selectedValue={logger_prefs.saved.loggers}
									/>
								</Box>
								<Box flex={1}>
									<Button width={'full'} mb={4} onClick={openSavedIncludeNumberInput}>
										Include Numbers({logger_prefs.saved.include.length})
									</Button>
									<NumberInputDialog
										numbers={logger_prefs.saved.include}
										onConfirm={(numbers) => dispatch(setSavedNumberInclude(numbers))}
										isOpen={isSavedIncludeNumberInputOpen}
										onClose={closeSavedIncludeNumberInput}
									/>
									<Button width={'full'} mb={4} onClick={openSavedExcludeNumberInput}>
										Exclude Numbers({logger_prefs.saved.exclude.length})
									</Button>
									<NumberInputDialog
										numbers={logger_prefs.saved.exclude}
										onConfirm={(numbers) => dispatch(setSavedNumberExclude(numbers))}
										isOpen={isSavedExcludeNumberInputOpen}
										onClose={closeSavedExcludeNumberInput}
									/>
								</Box>
							</Flex>
							<Divider my={4} />
							<Flex width={'full'} alignItems={'start'} justifyContent={'space-between'} gap={4}>
								<Text flex={1}>Unsaved Contacts</Text>
								<Box flex={1}>
									<MimeSelector
										onChange={(value) => {
											dispatch(setUnsavedMimeType(value));
										}}
										selectedValue={logger_prefs.unsaved.loggers}
									/>
								</Box>
								<Box flex={1}>
									<Button width={'full'} mb={4} onClick={openUnsavedIncludeNumberInput}>
										Include Numbers({logger_prefs.unsaved.include.length})
									</Button>
									<NumberInputDialog
										numbers={logger_prefs.unsaved.exclude}
										onConfirm={(numbers) => dispatch(setUnsavedNumberInclude(numbers))}
										isOpen={isUnsavedIncludeNumberInputOpen}
										onClose={closeUnsavedIncludeNumberInput}
									/>
									<Button width={'full'} mb={4} onClick={openUnsavedExcludeNumberInput}>
										Exclude Numbers({logger_prefs.unsaved.exclude.length})
									</Button>
									<NumberInputDialog
										numbers={logger_prefs.unsaved.exclude}
										onConfirm={(numbers) => dispatch(setUnsavedNumberExclude(numbers))}
										isOpen={isUnsavedExcludeNumberInputOpen}
										onClose={closeUnsavedExcludeNumberInput}
									/>
								</Box>
							</Flex>
							<Box>
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
											{filteredGroups.map((group, index) => {
												if (filteredGroups.length)
													return (
														<Tr key={index}>
															<Td>
																<Checkbox
																	isChecked={group_id.includes(group.id)}
																	onChange={() => handleSelectGroup(group.id)}
																	mr={'0.5rem'}
																/>
																{index + 1}
															</Td>
															<Td>{group.name}</Td>
															<Td>
																
															</Td>
														</Tr>
													);
											})}
										</Tbody>
									</Table>
								</TableContainer>
							</Box>
						</Box>
					</ModalBody>
					<ModalFooter className='gap-4 w-full !justify-between'>
						<Box className='self-start'>
							<Button onClick={openNewRuleInput} colorScheme='blue'>
								Add Rule
							</Button>
						</Box>
						<HStack>
							<Button colorScheme='green' onClick={updatePreferences}>
								Save
							</Button>
							<Button colorScheme='red' onClick={onClose}>
								Cancel
							</Button>
						</HStack>
					</ModalFooter>
					<GroupsRuleDialog isOpen={isNewRuleOpen} onClose={closeNewRuleInput} />
				</ModalContent>
			</Modal>
		</>
	);
};

export default MessageLoggingDialog;
