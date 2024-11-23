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
import { SchedulerByDateService } from '../../../../services/scheduler-by-date.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	editSelectedScheduler,
	setSelectedScheduler,
} from '../../../../store/reducers/SchedulerByDateReducer';
import ConfirmationAlert, { ConfirmationAlertHandle } from '../../../components/confirmation-alert';
import DeleteAlert, { DeleteAlertHandle } from '../../../components/delete-alert';

const SchedulerList = () => {
	const dispatch = useDispatch();
	const toast = useToast();
	const { all_schedulers } = useSelector(
		(state: StoreState) => state[StoreNames.SCHEDULER_BY_DATE]
	);

	const confirmationAlertRef = React.useRef<ConfirmationAlertHandle>(null);
	const deleteAlertRef = React.useRef<DeleteAlertHandle>(null);

	const handleSchedulerToggleActive = (id: string) => {
		toast.promise(SchedulerByDateService.toggleActive(id), {
			loading: { title: 'Toggling Scheduler' },
			success: (res) => {
				dispatch(editSelectedScheduler(res));
				return {
					title: 'Scheduler toggled.',
					duration: 1500,
				};
			},
			error: {
				title: 'Error toggling scheduler.',
				duration: 1500,
			},
		});
	};

	const handleDeleteScheduledMessage = (id: string) => {
		toast.promise(SchedulerByDateService.deleteScheduler(id), {
			loading: { title: 'Deleting Scheduler' },
			success: (res) => {
				dispatch(editSelectedScheduler(res));
				return {
					title: 'Scheduler deleted.',
				};
			},
			error: {
				title: 'Error deleting scheduler.',
			},
		});
	};

	const downloadSchedulerReport = (id: string) => {
		SchedulerByDateService.downloadResponses(id);
		toast({
			title: 'Downloading report.',
			description: 'Check task page for download.',
			duration: 1500,
		})

	};
	const reschedule = async (id: string) => {
		SchedulerByDateService.reschedule(id);
		toast({
			title: 'Rescheduling messages.',
			description: 'Check task page for status.',
			duration: 1500,
		});
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
						<Th>Selected Dates</Th>
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
							<Td>{scheduler.start_time}</Td>
							<Td>{scheduler.end_time}</Td>
							<Td>
								{scheduler.attachments.length}/{scheduler.shared_contact_cards.length}/
								{scheduler.polls.length}
							</Td>
							<Td>
								{scheduler.dates.map((date, index) => (
									<Box key={index}>{date}</Box>
								))}
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
											icon={scheduler.active ? <FiPause /> : <FiPlay />}
											onClick={() => {
												confirmationAlertRef.current?.open({
													id: scheduler.id,
													disclaimer: 'Are you change you want to change running status?',
													type: 'TOGGLE_SCHEDULER',
												});
											}}
											colorScheme={scheduler.active ? 'yellow' : 'blue'}
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

export default SchedulerList;
