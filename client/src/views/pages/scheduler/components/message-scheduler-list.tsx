import { DownloadIcon } from '@chakra-ui/icons';
import {
	Box,
	HStack,
	IconButton,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tooltip,
	Tr,
	useToast,
} from '@chakra-ui/react';
import React from 'react';
import { FiEdit, FiPause, FiPlay } from 'react-icons/fi';
import { MdDelete, MdScheduleSend } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import MessageService from '../../../../services/message.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	deleteScheduler,
	editSelectedScheduler,
	setSelectedScheduler,
} from '../../../../store/reducers/SchedulerReducer';
import ConfirmationAlert, { ConfirmationAlertHandle } from '../../../components/confirmation-alert';
import DeleteAlert, { DeleteAlertHandle } from '../../../components/delete-alert';

const MessageSchedulerList = () => {
	const dispatch = useDispatch();
	const toast = useToast();
	const { all_schedulers } = useSelector((state: StoreState) => state[StoreNames.SCHEDULER]);

	const confirmationAlertRef = React.useRef<ConfirmationAlertHandle>(null);
	const deleteAlertRef = React.useRef<DeleteAlertHandle>(null);

	const handleSchedulerToggleActive = (id: string) => {
		MessageService.toggleScheduledMessage(id).then((res) => {
			if (!res) return;
			dispatch(editSelectedScheduler(res));
		});
	};

	const handleDeleteScheduledMessage = (id: string) => {
		MessageService.deleteScheduledMessage(id).then((res) => {
			if (!res) return;
			dispatch(deleteScheduler(id));
		});
	};

	const downloadSchedulerReport = (id: string) => {
		MessageService.generateScheduledMessagesReport(id);
	};
	const reschedule = async (id: string) => {
		const rescheduled = await MessageService.reschedule(id);
		if (rescheduled) {
			toast({
				title: 'Messages Scheduled.',
				duration: 1500,
				status: 'success',
			});
		} else {
			toast({
				title: 'Messages Scheduling Failed.',
				duration: 1500,
				status: 'error',
			});
		}
	};

	const handleConfirmation = (id: string, type: string) => {
		if (type === 'TOGGLE_SCHEDULER') {
			handleSchedulerToggleActive(id);
		} else if (type === 'RESCHEDULE') {
			reschedule(id);
		}
	};

	return (
		<TableContainer mt={'1rem'}>
			<Table>
				<Thead>
					<Tr>
						<Th>Title</Th>
						<Th>Message</Th>
						<Th>Start Time</Th>
						<Th>End Time</Th>
						<Th>Attachments/Contacts/Polls</Th>
						<Th>Action</Th>
					</Tr>
				</Thead>
				<Tbody>
					{all_schedulers.map((scheduler, index) => (
						<Tr key={index}>
							<Td>{scheduler.title}</Td>
							<Td>
								{scheduler.message.split('\n').map((message, index) => (
									<Box key={index} className='whitespace-break-spaces'>
										{message}
									</Box>
								))}
							</Td>
							<Td>{scheduler.start_from}</Td>
							<Td>{scheduler.end_at}</Td>
							<Td>
								{scheduler.attachments.length}/{scheduler.shared_contact_cards.length}/
								{scheduler.polls.length}
							</Td>
							<Td>
								<HStack>
									<Tooltip label='Download Report' aria-label='Download Report'>
										<IconButton
											aria-label='download-scheduled-messages'
											icon={<DownloadIcon />}
											onClick={() => {
												downloadSchedulerReport(scheduler.id);
											}}
										/>
									</Tooltip>
									<Tooltip label='Toggle Scheduler' aria-label='Toggle Scheduler'>
										<IconButton
											aria-label='toggle-scheduler'
											icon={scheduler.isActive ? <FiPause /> : <FiPlay />}
											onClick={() => {
												confirmationAlertRef.current?.open({
													id: scheduler.id,
													disclaimer: 'Are you change you want to change running status?',
													type: 'TOGGLE_SCHEDULER',
												});
											}}
											colorScheme={scheduler.isActive ? 'yellow' : 'blue'}
										/>
									</Tooltip>
									<Tooltip label='Edit Scheduler' aria-label='Edit Scheduler'>
										<IconButton
											aria-label='edit-scheduler'
											icon={<FiEdit />}
											onClick={() => {
												dispatch(setSelectedScheduler(scheduler));
											}}
											colorScheme='gray'
										/>
									</Tooltip>
									<Tooltip label='Re-schedule' aria-label='Re-schedule'>
										<IconButton
											aria-label='re-schedule'
											icon={<MdScheduleSend />}
											onClick={() => {
												confirmationAlertRef.current?.open({
													id: scheduler.id,
													disclaimer: 'Are you sure you want to forcefully schedule the messages?',
													type: 'RESCHEDULE',
												});
											}}
											colorScheme='gray'
										/>
									</Tooltip>
									<Tooltip label='Delete Scheduler' aria-label='Delete Scheduler'>
										<IconButton
											aria-label='delete-scheduler'
											icon={<MdDelete />}
											onClick={() => deleteAlertRef.current?.open(scheduler.id)}
											colorScheme='red'
										/>
									</Tooltip>
								</HStack>
							</Td>
						</Tr>
					))}
				</Tbody>
			</Table>
			<ConfirmationAlert disclaimer='' ref={confirmationAlertRef} onConfirm={handleConfirmation} />
			<DeleteAlert
				ref={deleteAlertRef}
				onConfirm={handleDeleteScheduledMessage}
				type='Daily Schedule Message'
			/>
		</TableContainer>
	);
};

export default MessageSchedulerList;
