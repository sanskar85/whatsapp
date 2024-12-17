import {
	Box,
	Button,
	Flex,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Switch,
	Text,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import EnhancementService from '../../../../services/enhancements.service';
import { StoreNames, StoreState } from '../../../../store';
import { updateStarMessages } from '../../../../store/reducers/EnhancementsReducers';

export default function StarMessageRulesDialog({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const dispatch = useDispatch();

	const {
		messageStarRules: {
			group_incoming_messages,
			group_outgoing_messages,
			individual_incoming_messages,
			individual_outgoing_messages,
		},
	} = useSelector((state: StoreState) => state[StoreNames.ENHANCEMENT]);

	const handleSave = async () => {
		EnhancementService.updateStarMessagesPreferences({
			individual_incoming_messages,
			individual_outgoing_messages,
			group_incoming_messages,
			group_outgoing_messages,
		}).then((res) => {
			dispatch(updateStarMessages(res));
			onClose();
		});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size={'2xl'} scrollBehavior='inside'>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Star Message Rule</ModalHeader>
				<ModalBody>
					<Box>
						<Flex
							justifyContent={'space-between'}
							borderBottomWidth={1}
							py={2}
							alignItems={'center'}
						>
							<Text>Individual Incoming Messages</Text>
							<Switch
								isChecked={individual_incoming_messages}
								onChange={(e) =>
									dispatch(updateStarMessages({ individual_incoming_messages: e.target.checked }))
								}
							/>
						</Flex>
						<Flex
							justifyContent={'space-between'}
							borderBottomWidth={1}
							py={2}
							alignItems={'center'}
						>
							<Text>Individual Outgoing Messages</Text>
							<Switch
								isChecked={individual_outgoing_messages}
								onChange={(e) =>
									dispatch(updateStarMessages({ individual_outgoing_messages: e.target.checked }))
								}
							/>
						</Flex>
						<Flex
							justifyContent={'space-between'}
							borderBottomWidth={1}
							py={2}
							alignItems={'center'}
						>
							<Text>Group Incoming Messages</Text>
							<Switch
								isChecked={group_incoming_messages}
								onChange={(e) =>
									dispatch(updateStarMessages({ group_incoming_messages: e.target.checked }))
								}
							/>
						</Flex>
						<Flex
							justifyContent={'space-between'}
							borderBottomWidth={1}
							py={2}
							alignItems={'center'}
						>
							<Text>Group Outgoing Messages</Text>
							<Switch
								isChecked={group_outgoing_messages}
								onChange={(e) =>
									dispatch(updateStarMessages({ group_outgoing_messages: e.target.checked }))
								}
							/>
						</Flex>
					</Box>
				</ModalBody>
				<ModalFooter gap={4}>
					<Button colorScheme='red' onClick={onClose}>
						Close
					</Button>
					<Button colorScheme={'green'} onClick={handleSave}>
						Save
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
