import { SearchIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Checkbox,
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
	useToast,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EnhancementService from '../../../../services/enhancements.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	setMessageLoggerSettings,
	setNewRuleGroup,
	setNewRuleLoggers,
} from '../../../../store/reducers/EnhancementsReducers';
import MimeSelector from './mime-type-selector';

export default function GroupsRuleDialog({
	onClose,
	isOpen,
}: {
	onClose: () => void;
	isOpen: boolean;
}) {
	const toast = useToast();
	const dispatch = useDispatch();

	const { groups } = useSelector((store: StoreState) => store[StoreNames.USER]);
	const {
		newRuleDetails: { group_id, exclude, include, loggers },
		logger_prefs,
	} = useSelector((store: StoreState) => store[StoreNames.ENHANCEMENT]);

	const [range, setRange] = useState<{ start: string; end: string }>({
		start: '',
		end: '',
	});

	const [searchText, setSearchText] = useState<string>('');

	const filteredGroups = groups.filter((group) => !Object.keys(logger_prefs).includes(group.id));

	const filtered = filteredGroups.filter((group) =>
		group.name?.toLowerCase().startsWith(searchText.toLowerCase())
	);

	const allChecked = useMemo(() => {
		const selectedSet = new Set(group_id);
		return groups.every((item) => selectedSet.has(item.id));
	}, [groups, group_id]);

	const isIndeterminate = useMemo(() => {
		const selectedSet = new Set(group_id);
		return groups.some((item) => selectedSet.has(item.id));
	}, [groups, group_id]);

	const handleSelectAll = (allSelected: boolean) => {
		if (allSelected) {
			dispatch(setNewRuleGroup(groups.map((g) => g.id)));
		} else {
			dispatch(setNewRuleGroup([]));
		}
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
		dispatch(setNewRuleGroup(selectedIds));
		setRange({ start: '', end: '' });
	};

	const handleSelectGroup = (id: string) => {
		if (group_id.includes(id)) {
			dispatch(setNewRuleGroup(group_id.filter((gid) => gid !== id)));
		} else {
			dispatch(setNewRuleGroup([...group_id, id]));
		}
	};

	const handleSave = () => {
		toast.promise(
			EnhancementService.createMessageLogRule({
				exclude,
				group_id,
				include,
				loggers,
			}),
			{
				loading: {
					title: 'Saving Rule',
				},
				error: {
					title: 'Error saving rule',
				},
				success: (res) => {
					if (!res) {
						return {
							title: 'Error saving rule',
						};
					}
					EnhancementService.getEnhancements().then((res) => {
						if (res) {
							dispatch(setMessageLoggerSettings(res));
						}
					});
					onClose();
					return {
						title: ' Rule saved',
					};
				},
			}
		);
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size={'5xl'} scrollBehavior='inside'>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Group Rule</ModalHeader>
				<ModalBody>
					<Box>
						<HStack pb={4}>
							<Box flex={1}>
								<MimeSelector
									selectedValue={loggers}
									onChange={(value) => dispatch(setNewRuleLoggers(value))}
								/>
							</Box>
						</HStack>
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
															isChecked={group_id.includes(group.id)}
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
					</Box>
				</ModalBody>
				<ModalFooter>
					<Button colorScheme='blue' mr={3} onClick={onClose}>
						Close
					</Button>
					<Button colorScheme='green' onClick={handleSave}>
						Save
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
