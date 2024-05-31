import { EditIcon } from '@chakra-ui/icons';
import {
	Checkbox,
	HStack,
	IconButton,
	SkeletonText,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	useDisclosure,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { AiOutlineClear } from 'react-icons/ai';
import { IoIosCloudDownload } from 'react-icons/io';
import { PiPause, PiPlay } from 'react-icons/pi';
import { useDispatch, useSelector } from 'react-redux';
import useFilteredList from '../../../../hooks/useFilteredList';
import { useTheme } from '../../../../hooks/useTheme';
import GroupService from '../../../../services/group.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	addSelectedGroups,
	editSelectedGroup,
	removeSelectedGroups,
	setActive,
} from '../../../../store/reducers/MergeGroupReducer';
import ConfirmationAlert, { ConfirmationAlertHandle } from '../../../components/confirmation-alert';
import DeleteAlert, { DeleteAlertHandle } from '../../../components/delete-alert';
import GroupMerge from './group-merge-dialog';

export default function MergedGroupTab() {
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);
	const confirmationRef = useRef<ConfirmationAlertHandle>(null);

	const { isOpen, onOpen, onClose } = useDisclosure();
	const theme = useTheme();

	const dispatch = useDispatch();
	const {
		list,
		selectedGroups,
		uiDetails: { isFetching },
	} = useSelector((state: StoreState) => state[StoreNames.MERGE_GROUP]);

	const filtered = useFilteredList(list, { name: 1 });

	const toggleActive = (id: string) => {
		GroupService.toggleActiveMergeGroup(id).then((res) => {
			if (res !== null) {
				dispatch(setActive({ id, active: res }));
			}
		});
	};

	const clearHistory = (id: string) => {
		GroupService.clearHistory(id);
	};

	const download = (id: string) => {
		GroupService.downloadResponses(id);
	};

	return (
		<>
			<TableContainer>
				<Table>
					<Thead>
						<Tr>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Sl no.
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'75%'}>
								Group Name
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'15%'} isNumeric>
								No of Whatsapp Groups
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Action
							</Th>
						</Tr>
					</Thead>
					<Tbody>
						{isFetching && list.length === 0 ? (
							<Tr color={theme === 'dark' ? 'white' : 'black'}>
								<Td>
									<LineSkeleton />
								</Td>

								<Td>
									<LineSkeleton />
								</Td>

								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<LineSkeleton />
								</Td>
							</Tr>
						) : (
							filtered.map((group, index) => {
								return (
									<Tr key={index} cursor={'pointer'} color={theme === 'dark' ? 'white' : 'black'}>
										<Td>
											<Checkbox
												mr={'1rem'}
												isChecked={selectedGroups.includes(group.id)}
												onChange={(e) => {
													if (e.target.checked) {
														dispatch(addSelectedGroups(group.id));
													} else {
														dispatch(removeSelectedGroups(group.id));
													}
												}}
												colorScheme='green'
											/>
											{index + 1}.
										</Td>
										<Td>{group.name}</Td>
										<Td isNumeric>{group.groups.length}</Td>
										<Td>
											<HStack>
												<IconButton
													aria-label='toggle'
													icon={group.active ? <PiPause /> : <PiPlay />}
													color={group.active ? 'blue.400' : 'green.400'}
													onClick={() =>
														confirmationRef.current?.open({
															id: group.id,
															type: 'Group',
															disclaimer: 'Are you sure you want to toggle this group?',
														})
													}
													outline='none'
													border='none'
												/>
												<IconButton
													aria-label='edit merge group'
													icon={<EditIcon />}
													colorScheme='gray'
													onClick={() => {
														dispatch(editSelectedGroup(group.id));
														onOpen();
													}}
												/>
												<IconButton
													aria-label='clear'
													icon={<AiOutlineClear />}
													colorScheme='gray'
													onClick={() => deleteAlertRef.current?.open(group.id)}
												/>
												<IconButton
													aria-label='download'
													icon={<IoIosCloudDownload />}
													colorScheme='gray'
													onClick={() => download(group.id)}
												/>
											</HStack>
										</Td>
									</Tr>
								);
							})
						)}
					</Tbody>
				</Table>
			</TableContainer>
			<DeleteAlert ref={deleteAlertRef} onConfirm={clearHistory} type={'Previous Responses'} />
			<ConfirmationAlert ref={confirmationRef} onConfirm={toggleActive} disclaimer='' />
			<GroupMerge isOpen={isOpen} onClose={onClose} />
		</>
	);
}

function LineSkeleton() {
	return <SkeletonText mt='4' noOfLines={1} spacing='4' skeletonHeight='4' rounded={'md'} />;
}
