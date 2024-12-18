import { SearchIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Checkbox,
	Divider,
	Flex,
	HStack,
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
	Text,
	useDisclosure,
	useToast,
} from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';
import { BiTrash } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import EnhancementService from '../../../../services/enhancements.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	resetUpdatedValues,
	setIndividualMediaLoggers,
	setMediaExclude,
	setMediaInclude,
	setMessageLoggerSettings,
	setSavedMedia,
	setSavedText,
	setTextExclude,
	setTextInclude,
	setUnsavedMedia,
	setUnsavedText,
	updateLoggerPrefs,
} from '../../../../store/reducers/EnhancementsReducers';
import CheckButton from '../../../components/check-button';
import DeleteAlert, { DeleteAlertHandle } from '../../../components/delete-alert';
import NumberInputDialog from '../../../components/number-input-dialog';
import MimeSelector from './mime-type-selector';
import GroupsRuleDialog from './rule-dialog';

type MessageLoggingDialogProps = {
	isOpen: boolean;
	onClose: () => void;
};

const MessageLoggingDialog = ({ isOpen, onClose }: MessageLoggingDialogProps) => {
	const toast = useToast();

	const deleteRef = useRef<DeleteAlertHandle>(null);

	const { logger_prefs, updated_values } = useSelector(
		(state: StoreState) => state[StoreNames.ENHANCEMENT]
	);
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
		(group) => group.id !== 'individual_text' && group.id !== 'individual_media'
	);

	const filteredGroups = groups.filter((group) =>
		group.name?.toLowerCase().startsWith(searchText.toLowerCase())
	);

	const updatePreferences = () => {
		const promises = Object.keys(updated_values).map((key) => {
			const group = logger_prefs[key];
			return EnhancementService.updateMessageLoggerPreferences({
				id: group.id,
				exclude: group.exclude,
				include: group.include,
				loggers: group.loggers,
				saved: group.saved,
				unsaved: group.unsaved,
			});
		});

		toast.promise(Promise.all(promises), {
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
				EnhancementService.getEnhancements().then((res) => {
					if (res) {
						dispatch(setMessageLoggerSettings(res));
					}
				});

				onClose();
				dispatch(resetUpdatedValues());
				return {
					title: 'Saved preferences updated',
					duration: 3000,
				};
			},
			error: {
				title: 'Error updating saved preferences',
				duration: 3000,
			},
		});
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

	const handleDeleteRule = () => {
		const promises = group_id.map((id) => {
			return EnhancementService.deleteLoggerRule(id);
		});

		toast.promise(Promise.all(promises), {
			loading: {
				title: 'Deleting selected rules',
			},
			success: (res) => {
				if (!res) {
					return {
						title: 'Error deleting selected rules',
						duration: 3000,
					};
				}
				EnhancementService.getEnhancements().then((res) => {
					if (res) {
						dispatch(setMessageLoggerSettings(res));
					}
				});

				onClose();
				setGroupId([]);
				return {
					title: 'Selected rules deleted',
					duration: 3000,
				};
			},
			error: {
				title: 'Error deleting selected rules',
				duration: 3000,
			},
		});
	};

	return (
		<>
			<Modal isOpen={isOpen} isCentered onClose={onClose} size={'6xl'} scrollBehavior='inside'>
				<ModalOverlay />
				<ModalContent minHeight={'50vh'}>
					<ModalHeader>Message logging rules</ModalHeader>
					<ModalBody>
						<Box>
							<Box>
								<Text fontWeight={'medium'} fontSize={'lg'}>
									Individual Text Message
								</Text>
							</Box>
							<Flex width={'full'} alignItems={'center'} justifyContent={'flex-end'} gap={4}>
								<Box mr={'auto'}>
									<Text fontWeight={'medium'} color={'gray'}>
										Rules:-
									</Text>
								</Box>
								<Flex className='gap-2'>
									<CheckButton
										gap={2}
										label='Saved'
										name='Saved'
										onChange={({ value }) => dispatch(setSavedText(value))}
										value={logger_prefs.individual_text.saved}
									/>
								</Flex>
								<Flex className='gap-2'>
									<CheckButton
										gap={2}
										label='Unsaved'
										name='Unsaved'
										onChange={({ value }) => dispatch(setUnsavedText(value))}
										value={logger_prefs.individual_text.unsaved}
									/>
								</Flex>
								<Flex gap={2}>
									<Button
										fontWeight={'normal'}
										width={'full'}
										onClick={openSavedIncludeNumberInput}
									>
										Include ({logger_prefs.individual_text.include.length})
									</Button>
									<NumberInputDialog
										numbers={logger_prefs.individual_text.include}
										onConfirm={(numbers) => dispatch(setTextInclude(numbers))}
										isOpen={isSavedIncludeNumberInputOpen}
										onClose={closeSavedIncludeNumberInput}
									/>
									<Button
										fontWeight={'normal'}
										width={'full'}
										onClick={openSavedExcludeNumberInput}
									>
										Exclude ({logger_prefs.individual_text.exclude.length})
									</Button>
									<NumberInputDialog
										numbers={logger_prefs.individual_text.exclude}
										onConfirm={(numbers) => dispatch(setTextExclude(numbers))}
										isOpen={isSavedExcludeNumberInputOpen}
										onClose={closeSavedExcludeNumberInput}
									/>
								</Flex>
							</Flex>
							<Divider my={4} />
							<Box>
								<Text fontWeight={'medium'} fontSize={'lg'}>
									Individual Media Message
								</Text>
							</Box>
							<Flex width={'full'} alignItems={'center'} justifyContent={'space-between'} gap={4}>
								<Box mr={'auto'}>
									<Text fontWeight={'medium'} color={'gray'}>
										Rules:-
									</Text>
								</Box>
								<Flex className='gap-2'>
									<CheckButton
										gap={2}
										label='Saved'
										name='Saved'
										onChange={({ value }) => dispatch(setSavedMedia(value))}
										value={logger_prefs.individual_media.saved}
									/>
								</Flex>
								<Flex className='gap-2'>
									<CheckButton
										gap={2}
										label='Unsaved'
										name='Unsaved'
										onChange={({ value }) => dispatch(setUnsavedMedia(value))}
										value={logger_prefs.individual_media.unsaved}
									/>
								</Flex>

								<Flex gap={2}>
									<Button fontWeight={'normal'} onClick={openUnsavedIncludeNumberInput}>
										Include({logger_prefs.individual_media.include.length})
									</Button>
									<NumberInputDialog
										numbers={logger_prefs.individual_media.include}
										onConfirm={(numbers) => dispatch(setMediaInclude(numbers))}
										isOpen={isUnsavedIncludeNumberInputOpen}
										onClose={closeUnsavedIncludeNumberInput}
									/>
									<Button fontWeight={'normal'} onClick={openUnsavedExcludeNumberInput}>
										Exclude({logger_prefs.individual_media.exclude.length})
									</Button>
									<NumberInputDialog
										numbers={logger_prefs.individual_text.exclude}
										onConfirm={(numbers) => dispatch(setMediaExclude(numbers))}
										isOpen={isUnsavedExcludeNumberInputOpen}
										onClose={closeUnsavedExcludeNumberInput}
									/>
								</Flex>
								<Box>
									<MimeSelector
										onChange={(value) => {
											dispatch(setIndividualMediaLoggers(value));
										}}
										selectedValue={logger_prefs.individual_media.loggers}
										exclude_options='text'
									/>
								</Box>
							</Flex>
							<Divider my={4} />
							<Box pb={2}>
								<Text fontWeight={'medium'} fontSize={'lg'}>
									Group Message
								</Text>
							</Box>
							<Box>
								<Box>
									<Text>Select Group Range</Text>
								</Box>

								<Flex flexDirection={'column'}>
									<HStack borderBottomWidth={1} p={4} alignItems={'center'}>
										<Box width={'2%'} className='inline-flex items-center gap-2'>
											<Checkbox
												isChecked={allChecked}
												isIndeterminate={isIndeterminate && !allChecked}
												onChange={(e) => handleSelectAll(e.target.checked)}
											/>
										</Box>
										<Box width={'full'}>
											<Flex
												alignItems={'center'}
												justifyContent={'space-between'}
												direction={'row'}
												gap={4}
											>
												<Text mr={'auto'}>Name</Text>
												<Flex gap={2} justifyContent={'flex-end'}>
													<Box width={'150px'}>
														<Input
															size={'sm'}
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
													<Box width={'150px'}>
														<Input
															size={'sm'}
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
													<Button size={'sm'} colorScheme='green' onClick={handleSelectRange}>
														Select range
													</Button>
												</Flex>
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
												<IconButton
													aria-label='delete rules'
													icon={<BiTrash />}
													colorScheme='red'
													size={'sm'}
													ml={2}
													hidden={group_id.length === 0}
													onClick={() => deleteRef.current?.open()}
												/>
											</Flex>
										</Box>
									</HStack>
									{filteredGroups.map((group, index) => {
										if (filteredGroups.length)
											return (
												<HStack key={index} p={4} borderBottomWidth={1}>
													<Box className='inline-flex items-center gap-2'>
														<Checkbox
															isChecked={group_id.includes(group.id)}
															onChange={() => handleSelectGroup(group.id)}
														/>
														{index + 1}
													</Box>
													<Box width={'450px'}>{group.name}</Box>
													<Box>
														<Box width={'450px'}>
															<MimeSelector
																selectedValue={group.loggers}
																onChange={(value) => {
																	dispatch(
																		updateLoggerPrefs({
																			...group,
																			loggers: value,
																		})
																	);
																}}
															/>
														</Box>
													</Box>
												</HStack>
											);
									})}
								</Flex>
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
							<Button
								isDisabled={Object.keys(updated_values).length === 0}
								colorScheme='green'
								onClick={updatePreferences}
							>
								Save
							</Button>
							<Button colorScheme='red' onClick={onClose}>
								Cancel
							</Button>
						</HStack>
					</ModalFooter>
					<GroupsRuleDialog isOpen={isNewRuleOpen} onClose={closeNewRuleInput} />
					<DeleteAlert ref={deleteRef} type='Rule' onConfirm={handleDeleteRule} />
				</ModalContent>
			</Modal>
		</>
	);
};

export default MessageLoggingDialog;
