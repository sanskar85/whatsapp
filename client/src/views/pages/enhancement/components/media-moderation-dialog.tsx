import { SearchIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Checkbox,
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
	setMediaModerationRules,
} from '../../../../store/reducers/EnhancementsReducers';
import DeleteAlert, { DeleteAlertHandle } from '../../../components/delete-alert';
import GroupsRuleDialog from './rule-dialog';

type MediaModerationDialogProps = {
	isOpen: boolean;
	onClose: () => void;
};

const MediaModerationDialog = ({ isOpen, onClose }: MediaModerationDialogProps) => {
	const toast = useToast();

	const deleteRef = useRef<DeleteAlertHandle>(null);

	const { mediaModerationRules, updated_values } = useSelector(
		(state: StoreState) => state[StoreNames.ENHANCEMENT]
	);

	const { groups: userGroups } = useSelector((store: StoreState) => store[StoreNames.USER]);
	const dispatch = useDispatch();

	const [group_id, setGroupId] = useState<string[]>([]);

	const [range, setRange] = useState<{ start: string; end: string }>({
		start: '',
		end: '',
	});

	const [searchText, setSearchText] = useState<string>('');

	const {
		isOpen: isNewRuleOpen,
		onClose: closeNewRuleInput,
		onOpen: openNewRuleInput,
	} = useDisclosure();

	const groups = Object.values(mediaModerationRules).filter(
		(group) => group.id !== 'individual_text' && group.id !== 'individual_media'
	);

	const filteredGroups = groups.filter((group) =>
		group.name?.toLowerCase().startsWith(searchText.toLowerCase())
	);

	const updatePreferences = () => {
		const promises = Object.keys(updated_values).map((key) => {
			const group = mediaModerationRules[key];
			return EnhancementService.updateMediaModerationPreference({
				id: group.id,
				restricted_medias: group.restricted_medias,
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
				EnhancementService.getMediaModerationRules().then((res) => {
					if (res) {
						dispatch(setMediaModerationRules(res));
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
			return EnhancementService.deleteMediaModerationRule(id);
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
				EnhancementService.getMediaModerationRules().then((res) => {
					if (res) {
						dispatch(setMediaModerationRules(res));
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

	const handleAddRules = ({ group_id, loggers }: { group_id: string[]; loggers: string[] }) => {
		toast.promise(
			EnhancementService.createMediaModerationPreference({ group_id, restricted_medias: loggers }),
			{
				loading: {
					title: 'Adding new rule',
				},
				success: (res) => {
					if (!res) {
						return {
							title: 'Error adding new rule',
						};
					}
					EnhancementService.getMediaModerationRules().then((res) => {
						if (res) {
							dispatch(setMediaModerationRules(res));
						}
					});

					closeNewRuleInput();
					return {
						title: 'New rule added',
					};
				},
				error: {
					title: 'Error adding new rule',
				},
			}
		);
	};

	return (
		<>
			<Modal isOpen={isOpen} isCentered onClose={onClose} size={'6xl'} scrollBehavior='inside'>
				<ModalOverlay />
				<ModalContent minHeight={'50vh'}>
					<ModalHeader>APK Moderation rules</ModalHeader>
					<ModalBody>
						<Box>
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
													<Box width={'450px'}>
														{userGroups.find((ele) => ele.id === group.id)?.name ?? ''}
													</Box>
													{/* <Box>
														<Box width={'450px'}>
															<MimeSelector
																selectedValue={group.restricted_medias}
																onChange={(value) => {
																	dispatch(
																		updateMediaModerationRules({
																			...group,
																			restricted_medias: value,
																		})
																	);
																}}
															/>
														</Box>
													</Box> */}
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
					<GroupsRuleDialog
						isApk
						onConfirm={({ group_id }) =>
							handleAddRules({ group_id, loggers: ['application/vnd.android.package-archive'] })
						}
						selectedGroupIds={Object.keys(mediaModerationRules)}
						isOpen={isNewRuleOpen}
						onClose={closeNewRuleInput}
					/>
					<DeleteAlert ref={deleteRef} type='Rule' onConfirm={handleDeleteRule} />
				</ModalContent>
			</Modal>
		</>
	);
};

export default MediaModerationDialog;
