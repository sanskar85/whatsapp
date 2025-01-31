import {
	Box,
	Button,
	FormControl,
	FormLabel,
	HStack,
	Switch,
	TabPanel,
	TabPanels,
	Tabs,
	useDisclosure,
	useToast,
} from '@chakra-ui/react';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MdGroupAdd, MdGroups3 } from 'react-icons/md';
import { RiUserAddFill } from 'react-icons/ri';
import { TbListDetails } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import GroupService from '../../../services/group.service';
import { StoreNames, StoreState } from '../../../store';
import {
	addAllGroups,
	clearEditMergeGroup,
	clearSelectedGroup,
	deleteMergedGroup,
	setIsDeleting,
} from '../../../store/reducers/MergeGroupReducer';
import DeleteAlert, { DeleteAlertHandle } from '../../components/delete-alert';
import LinkInputDialog from '../../components/link-input-dialog';
import { NavbarDeleteElement, NavbarSearchElement } from '../../components/navbar';
import { TaskInput, TaskInputHandle } from '../../components/task-description-input';
import {
	GroupMergeDialog,
	GroupSettingDialog,
	MergedGroupTab,
	WhatsappGroupTab,
} from './components';

const GroupMergePage = () => {
	const taskDescriptionInput = useRef<TaskInputHandle>(null);
	const {
		isOpen: isMergeDialogOpen,
		onOpen: openMergeDialog,
		onClose: closeMergeDialog,
	} = useDisclosure();
	const {
		isOpen: isLinkDialogOpen,
		onOpen: openLinkDialog,
		onClose: closeLinkDialog,
	} = useDisclosure();
	const {
		isOpen: isSettingDialogOpen,
		onOpen: openSettingDialog,
		onClose: closeSettingDialog,
	} = useDisclosure();
	const toast = useToast();
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);
	const [tabIndex, setTabIndex] = useState(0);

	const dispatch = useDispatch();
	const theme = useTheme();
	const {
		selectedGroups,
		uiDetails: { isDeleting },
	} = useSelector((state: StoreState) => state[StoreNames.MERGE_GROUP]);

	const deleteGroup = () => {
		dispatch(setIsDeleting(true));
		selectedGroups.forEach(async (id) => {
			GroupService.deleteMerged(id).then((res) => {
				if (!res) {
					return;
				}
				dispatch(deleteMergedGroup(id));
			});
		});
	};

	const exportPendingRequests = useCallback(
		(task_description?: string) => {
			GroupService.exportPendingRequests(selectedGroups, task_description);
			toast({
				title: 'Exporting Pending Requests',
				description: 'Please check background tasks for progress',
				status: 'info',
				duration: 3000,
				isClosable: true,
			});
			taskDescriptionInput.current?.close();
		},
		[selectedGroups, toast]
	);

	useEffect(() => {
		function handleSwitchChange(isWhatsappGroups: boolean) {
			setTabIndex(isWhatsappGroups ? 1 : 0);
			dispatch(clearSelectedGroup());
		}
		pushToNavbar({
			title: 'Groups',
			icon: MdGroups3,
			actions: (
				<HStack>
					<FormControl width={'fit-content'} display='flex' alignItems='center' gap='0.5rem'>
						<FormLabel mb='0' color={theme === 'dark' ? 'gray.300' : 'gray.700'}>
							Merged Groups
						</FormLabel>
						<Switch id='merged-groups' onChange={(e) => handleSwitchChange(e.target.checked)} />
						<FormLabel mb='0' color={theme === 'dark' ? 'gray.300' : 'gray.700'}>
							Whatsapp Groups
						</FormLabel>
					</FormControl>
					<NavbarSearchElement />
					<NavbarDeleteElement
						isDisabled={selectedGroups.length === 0 || tabIndex !== 0}
						onClick={() => deleteAlertRef.current?.open('')}
					/>
					{
						tabIndex === 0 ? (
							<>
								<Button
									leftIcon={<MdGroupAdd />}
									size={'sm'}
									colorScheme='blue'
									onClick={() => {
										dispatch(clearEditMergeGroup());
										openMergeDialog();
									}}
								>
									MERGE
								</Button>
								<Button
									leftIcon={<TbListDetails />}
									size={'sm'}
									colorScheme='blue'
									onClick={() => {
										dispatch(clearEditMergeGroup());
										openLinkDialog();
									}}
								>
									INVITE DETAILS
								</Button>
							</>
						) : (
							<Button
								leftIcon={<RiUserAddFill />}
								size={'sm'}
								colorScheme='blue'
								isDisabled={selectedGroups.length === 0}
								onClick={() => taskDescriptionInput.current?.open()}
							>
								Pending Requests
							</Button>
						)
						// 	<Button
						// 		leftIcon={<MdAdminPanelSettings />}
						// 		size={'sm'}
						// 		colorScheme='blue'
						// 		isDisabled={selectedGroups.length === 0}
						// 		onClick={openSettingDialog}
						// 	>
						// 		GROUP SETTINGS
						// 	</Button>
					}
					{tabIndex === 0 && (
						<Button colorScheme='blue' size={'sm'} onClick={() => dispatch(addAllGroups())}>
							Select All
						</Button>
					)}
				</HStack>
			),
		});
		return () => {
			popFromNavbar();
		};
	}, [
		openMergeDialog,
		selectedGroups.length,
		isDeleting,
		dispatch,
		tabIndex,
		openSettingDialog,
		openLinkDialog,
		theme,
		exportPendingRequests,
	]);

	return (
		<Box>
			<Tabs index={tabIndex}>
				<TabPanels>
					<TabPanel>
						<MergedGroupTab />
					</TabPanel>
					<TabPanel>
						<WhatsappGroupTab />
					</TabPanel>
				</TabPanels>
			</Tabs>
			<DeleteAlert ref={deleteAlertRef} onConfirm={deleteGroup} type={'Merged Groups'} />
			<GroupMergeDialog isOpen={isMergeDialogOpen} onClose={closeMergeDialog} />
			<GroupSettingDialog isOpen={isSettingDialogOpen} onClose={closeSettingDialog} />
			<LinkInputDialog isOpen={isLinkDialogOpen} onClose={closeLinkDialog} />
			<TaskInput
				ref={taskDescriptionInput}
				onConfirm={({ task_description }) => {
					exportPendingRequests(task_description);
				}}
			/>
		</Box>
	);
};

export default GroupMergePage;
