import {
	Box,
	Flex,
	IconButton,
	Switch,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	useDisclosure,
} from '@chakra-ui/react';
import { useEffect } from 'react';
import { PiGear } from 'react-icons/pi';
import { TbGraph } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { NAVIGATION } from '../../../config/const';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import EnhancementService from '../../../services/enhancements.service';
import { StoreNames, StoreState } from '../../../store';
import { setMessageLogger } from '../../../store/reducers/EnhancementsReducers';
import MessageLoggingDialog from './components/message-logger-dialog';
import StarMessageRulesDialog from './components/star-message-rules-dialog';

export default function Logger() {
	const dispatch = useDispatch();

	const { groups } = useSelector((state: StoreState) => state[StoreNames.USER]);
	const { message_logger } = useSelector((state: StoreState) => state[StoreNames.ENHANCEMENT]);

	const {
		isOpen: isOpenMessageLoggingDialog,
		onClose: onCloseMessageLoggingDialog,
		onOpen: onOpenMessageLoggingDialog,
	} = useDisclosure();

	const {
		isOpen: isOpenStarMessageRulesDialog,
		onClose: onCloseStarMessageRulesDialog,
		onOpen: onOpenStarMessageRulesDialog,
	} = useDisclosure();

	useEffect(() => {
		pushToNavbar({
			title: 'Enhancement',
			icon: TbGraph,
			link: NAVIGATION.ENHANCEMENT,
		});
		return () => {
			popFromNavbar();
		};
	}, []);

	if (groups.length === 0) {
		return (
			<Box className='p-4 text-center'>
				<Text className='text-black dark:text-white font-medium text-lg'>
					Please Link WhatsApp First!
				</Text>
			</Box>
		);
	}

	const toggleMessageLogging = async () => {
		if (message_logger) {
			await EnhancementService.disableMessageLogging().then((res) => {
				if (res) {
					dispatch(setMessageLogger(false));
					return;
				}
			});
		} else {
			await EnhancementService.enableMessageLogging().then((res) => {
				if (res) {
					dispatch(setMessageLogger(true));
					return;
				}
			});
		}
	};

	return (
		<Box>
			<Box>
				<TableContainer>
					<Table variant={'unstyled'}>
						<Thead className='text-black dark:text-white'>
							<Tr>
								<Th width={'90%'}>Item</Th>
								<Th>Action</Th>
							</Tr>
						</Thead>
						<Tbody>
							<Tr>
								<Td className='text-black dark:text-white'>Message logger</Td>
								<Td>
									<Flex gap={4} alignItems={'center'} justifyContent={'flex-end'} px={8}>
										<Switch
											colorScheme='green'
											isChecked={message_logger}
											onChange={() => toggleMessageLogging()}
										/>
										<IconButton
											aria-label='settings'
											colorScheme='blue'
											onClick={onOpenMessageLoggingDialog}
											isDisabled={!message_logger}
										>
											<PiGear />
										</IconButton>
									</Flex>
								</Td>
							</Tr>
							<Tr>
								<Td className='text-black dark:text-white'>Star Messages</Td>
								<Td>
									<Flex gap={4} alignItems={'center'} justifyContent={'flex-end'} px={8}>
										<IconButton
											aria-label='settings'
											colorScheme='blue'
											onClick={onOpenStarMessageRulesDialog}
										>
											<PiGear />
										</IconButton>
									</Flex>
								</Td>
							</Tr>
						</Tbody>
					</Table>
				</TableContainer>
			</Box>
			<MessageLoggingDialog
				isOpen={isOpenMessageLoggingDialog}
				onClose={onCloseMessageLoggingDialog}
			/>
			<StarMessageRulesDialog
				isOpen={isOpenStarMessageRulesDialog}
				onClose={onCloseStarMessageRulesDialog}
			/>
		</Box>
	);
}
