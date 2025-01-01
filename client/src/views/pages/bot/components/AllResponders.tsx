import { EditIcon } from '@chakra-ui/icons';
import {
	Box,
	IconButton,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tooltip,
	Tr,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { IoIosCloudDownload } from 'react-icons/io';
import { MdDelete } from 'react-icons/md';
import { PiPause, PiPlay } from 'react-icons/pi';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../../../hooks/useTheme';
import BotService from '../../../../services/bot.service';
import { StoreNames, StoreState } from '../../../../store';
import { removeBot, setSelectedBot, updateBot } from '../../../../store/reducers/BotReducers';
import ConfirmationAlert, { ConfirmationAlertHandle } from '../../../components/confirmation-alert';
import DeleteAlert, { DeleteAlertHandle } from '../../../components/delete-alert';

export default function AllResponders() {
	const theme = useTheme();
	const dispatch = useDispatch();
	const { all_bots } = useSelector((state: StoreState) => state[StoreNames.CHATBOT]);
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);
	const confirmationAlertRef = useRef<ConfirmationAlertHandle>(null);

	const deleteBot = (id: string) => {
		BotService.deleteBot(id).then((res) => {
			if (!res) return;
			dispatch(removeBot(id));
		});
	};

	const toggleBot = (id: string) => {
		BotService.toggleBot(id).then((res) => {
			if (!res) {
				return;
			}
			dispatch(updateBot({ id, data: res }));
		});
	};

	return (
		<>
			<Text
				fontSize={'2xl'}
				className='text-gray-700 dark:text-gray-400'
				textAlign={'center'}
				pt={'2rem'}
				pb={'1rem'}
			>
				All Responders
			</Text>
			<TableContainer>
				<Table>
					<Thead>
						<Tr>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'35%'}>
								Trigger
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'35%'}>
								Message
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Recipients
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Conditions
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Attachments/Contacts
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Delay
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'10%'}>
								Actions
							</Th>
						</Tr>
					</Thead>
					<Tbody>
						{all_bots.map((bot, index) => (
							<Tr
								key={index}
								color={
									theme === 'dark'
										? bot.isActive
											? 'white'
											: 'red'
										: bot.isActive
										? 'black'
										: 'red'
								}
							>
								<Td>
									{bot.trigger.map((trigger, index) => (
										<Box key={index}>
											{trigger.length > 20 ? trigger.substring(0, 18) + '...' : trigger}
										</Box>
									))}
								</Td>
								<Td className='whitespace-break-spaces'>{bot.message}</Td>
								<Td>
									{bot.recipient.saved && bot.recipient.unsaved
										? 'All'
										: bot.recipient.saved
										? 'Saved'
										: bot.recipient.unsaved
										? 'Unsaved'
										: 'None'}
								</Td>
								<Td>{bot.options.split('_').join(' ')}</Td>
								<Td>
									{bot.attachments.length} / {bot.shared_contact_cards.length}
								</Td>
								<Td>
									{bot.trigger_gap_seconds < 60
										? `${bot.trigger_gap_seconds} s`
										: bot.trigger_gap_seconds < 3600
										? `${Math.floor(bot.trigger_gap_seconds / 60)} m`
										: bot.trigger_gap_seconds < 86400
										? `${Math.floor(bot.trigger_gap_seconds / 3600)} h`
										: `${Math.floor(bot.trigger_gap_seconds / 86400)} day`}
								</Td>
								<Td>
									<Tooltip label='Delete Responder' aria-label='Delete Responder'>
										<IconButton
											aria-label='Delete'
											icon={<MdDelete />}
											color={'red.400'}
											onClick={() => {
												deleteAlertRef.current?.open(bot.bot_id);
											}}
											bgColor={'transparent'}
											_hover={{
												bgColor: 'transparent',
											}}
											outline='none'
											border='none'
										/>
									</Tooltip>
									<Tooltip label='Edit Responder' aria-label='Edit Responder'>
										<IconButton
											aria-label='Edit'
											icon={<EditIcon />}
											color={'yellow.400'}
											onClick={() => dispatch(setSelectedBot(bot.bot_id))}
											bgColor={'transparent'}
											_hover={{
												bgColor: 'transparent',
											}}
											outline='none'
											border='none'
										/>
									</Tooltip>
									<Tooltip label='Toggle Responder' aria-label='Toggle Responder'>
										<IconButton
											aria-label='toggle'
											icon={bot.isActive ? <PiPause /> : <PiPlay />}
											color={bot.isActive ? 'blue.400' : 'green.400'}
											onClick={() => {
												confirmationAlertRef.current?.open({
													id: bot.bot_id,
													disclaimer: 'Are you sure you want to change running status?',
													type: 'TOGGLE_BOT',
												});
											}}
											bgColor={'transparent'}
											_hover={{
												bgColor: 'transparent',
											}}
											outline='none'
											border='none'
										/>
									</Tooltip>
									<Tooltip label='Download History' aria-label='Download History'>
										<IconButton
											aria-label='History'
											icon={<IoIosCloudDownload />}
											color={'red.400'}
											onClick={() => {
												BotService.downloadResponses(bot.bot_id);
											}}
											bgColor={'transparent'}
											_hover={{
												bgColor: 'transparent',
											}}
											outline='none'
											border='none'
										/>
									</Tooltip>
								</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			</TableContainer>
			<DeleteAlert type={'Responder'} ref={deleteAlertRef} onConfirm={deleteBot} />
			<ConfirmationAlert ref={confirmationAlertRef} onConfirm={toggleBot} disclaimer='' />
		</>
	);
}
