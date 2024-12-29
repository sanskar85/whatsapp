import { EditIcon } from '@chakra-ui/icons';
import {
	Box,
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
	Tooltip,
	Tr,
	useDisclosure,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { AiOutlineClear } from 'react-icons/ai';
import { IoIosCloudDownload } from 'react-icons/io';
import { MdRule } from 'react-icons/md';
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
import MessageModerationRule, {
	MessageModerationRuleHandle,
} from '../../../components/message-moderation-dialog';
import GroupMerge from './group-merge-dialog';

export default function MergedGroupTab() {
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);
	const confirmationRef = useRef<ConfirmationAlertHandle>(null);
	const moderationRuleRef = useRef<MessageModerationRuleHandle>(null);

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
												<Tooltip label='Toggle group' aria-label='Toggle group' placement='top'>
													<IconButton
														title='Toggle group'
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
												</Tooltip>
												<Tooltip
													label='Edit merge group'
													aria-label='Edit merge group'
													placement='top'
												>
													<IconButton
														aria-label='edit merge group'
														icon={<EditIcon />}
														colorScheme='gray'
														onClick={() => {
															dispatch(editSelectedGroup(group.id));
															onOpen();
														}}
													/>
												</Tooltip>
												<Tooltip label='Clear history' aria-label='Clear history' placement='top'>
													<IconButton
														title='Clear history'
														aria-label='clear'
														icon={<AiOutlineClear />}
														colorScheme='gray'
														onClick={() => deleteAlertRef.current?.open(group.id)}
													/>
												</Tooltip>
												<Tooltip
													label='Download responses'
													aria-label='Download responses'
													placement='top'
												>
													<IconButton
														title='Download responses'
														aria-label='download'
														icon={
															<Box as='span' title='Download responses'>
																<IoIosCloudDownload />
															</Box>
														}
														colorScheme='gray'
														onClick={() => download(group.id)}
													/>
												</Tooltip>
												<Tooltip
													label='Moderation Rules'
													aria-label='Moderation Rules'
													placement='top'
												>
													<IconButton
														title='Moderation Rules'
														aria-label='rules'
														icon={
															<Box as='span' title='Moderation Rules'>
																<MdRule />
															</Box>
														}
														colorScheme='gray'
														onClick={() =>
															moderationRuleRef.current?.onOpen(group.id, group.moderator_rules)
														}
													/>
												</Tooltip>
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
			<MessageModerationRule ref={moderationRuleRef} />
			<GroupMerge isOpen={isOpen} onClose={onClose} />
		</>
	);
}

function LineSkeleton() {
	return <SkeletonText mt='4' noOfLines={1} spacing='4' skeletonHeight='4' rounded={'md'} />;
}
