import {
	Box,
	Button,
	Divider,
	Flex,
	FormControl,
	FormLabel,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Tag,
	TagLabel,
	Text,
	Textarea,
	useToast,
	VStack,
} from '@chakra-ui/react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import GroupService from '../../../services/group.service';
import { MergedGroup } from '../../../store/types/MergeGroupState';
import AddOns from '../add-ons';

export type MessageModerationRuleHandle = {
	isOpen: boolean;
	onClose: () => void;
	onOpen: (id: string, data: MergedGroup['moderator_rules']) => void;
};

const MessageModerationRule = forwardRef<MessageModerationRuleHandle>((_, ref) => {
	const messageRef = useRef<HTMLTextAreaElement | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [merged_group_id, setMergedGroupId] = useState<string>('');
	const toast = useToast();

	const [group_rule, setGroupRule] = useState<{
		message: string;
		attachments: string[];
		shared_contact_cards: string[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	}>({
		message: '',
		attachments: [],
		shared_contact_cards: [],
		polls: [],
	});
	const [creator_rule, setCreatorRule] = useState<{
		message: string;
		attachments: string[];
		shared_contact_cards: string[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	}>({
		message: '',
		attachments: [],
		shared_contact_cards: [],
		polls: [],
	});

	const onClose = () => setIsOpen(false);

	const onOpen = () => setIsOpen(true);

	useImperativeHandle(ref, () => ({
		isOpen,
		onClose,
		onOpen: (id: string, data: MergedGroup['moderator_rules']) => {
            console.log(data, 'merged')
			setGroupRule(data.group_rule);
			setCreatorRule(data.creator_rule);
			setMergedGroupId(id);
			onOpen();
		},
	}));

	const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (messageRef.current) {
			const cursorPosition = messageRef.current.selectionStart;
			const message = creator_rule.message;
			const newMessage =
				message.slice(0, cursorPosition) +
				' ' +
				e.currentTarget.textContent +
				message.slice(cursorPosition);
			setCreatorRule((prev) => ({ ...prev, message: newMessage }));
		}
	};

	const handleSave = () => {
		toast.promise(
			GroupService.updateMessageModerationRules({
				merged_group_id,
				details: {
					group_rule,
					creator_rule,
					admin_rule: creator_rule,
					file_types: ['application/vnd.android.package-archive'],
				},
			}),
			{
				loading: { title: 'Saving...' },
				success: () => {
					onClose();
					setGroupRule({
						message: '',
						attachments: [],
						shared_contact_cards: [],
						polls: [],
					});
					setCreatorRule({
						message: '',
						attachments: [],
						shared_contact_cards: [],
						polls: [],
					});
					setMergedGroupId('');
					return { title: 'Saved!', description: 'Message moderation rule saved successfully' };
				},
				error: { title: 'Failed!', description: 'Message moderation rule could not be saved' },
			}
		);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size='5xl'>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>
					<Text fontSize='2xl' fontWeight='bold'>
						Message Moderation Rule
					</Text>
				</ModalHeader>
				<ModalBody>
					<Flex gap={4} flexDirection={'column'}>
						<VStack alignItems={'stretch'} gap={'1rem'}>
							<FormControl>
								<FormLabel>In-Group Reply</FormLabel>
								<Textarea
									width={'full'}
									size={'sm'}
									rounded={'md'}
									placeholder={'eg. Hello there!'}
									border={'none'}
									className='text-black !bg-[#ECECEC] '
									_placeholder={{
										opacity: 0.4,
										color: 'inherit',
									}}
									_focus={{ border: 'none', outline: 'none' }}
									value={group_rule.message}
									onChange={(e) =>
										setGroupRule((prev) => {
											return { ...prev, message: e.target.value };
										})
									}
								/>
							</FormControl>

							<Box>
								<AddOns
									attachments={group_rule.attachments}
									shared_contact_cards={group_rule.shared_contact_cards}
									polls={group_rule.polls}
									onAttachmentsSelected={(ids) =>
										setGroupRule((prev) => {
											return { ...prev, attachments: ids };
										})
									}
									onContactsSelected={(ids) =>
										setGroupRule((prev) => {
											return { ...prev, shared_contact_cards: ids };
										})
									}
									onPollsSelected={(ids) =>
										setGroupRule((prev) => {
											return { ...prev, polls: ids };
										})
									}
								/>
							</Box>
						</VStack>
						<Divider p={1} />
						<VStack alignItems={'stretch'} gap={'1rem'}>
							<FormControl>
								<FormLabel>Admin/Creator Reply</FormLabel>
								<Textarea
									ref={messageRef}
									width={'full'}
									size={'sm'}
									rounded={'md'}
									placeholder={'eg. Hello there!'}
									border={'none'}
									className='text-black !bg-[#ECECEC] '
									_placeholder={{
										opacity: 0.4,
										color: 'inherit',
									}}
									_focus={{ border: 'none', outline: 'none' }}
									value={creator_rule.message}
									onChange={(e) =>
										setCreatorRule((prev) => ({ ...prev, message: e.target.value }))
									}
								/>
							</FormControl>
							<Flex>
								<Tag
									size={'sm'}
									m={'0.25rem'}
									p={'0.5rem'}
									width={'fit-content'}
									borderRadius='md'
									variant='solid'
									colorScheme='gray'
									_hover={{ cursor: 'pointer' }}
									onClick={onClick}
								>
									<TagLabel>{'{{admin_public_name}}'}</TagLabel>
								</Tag>
								<Tag
									size={'sm'}
									m={'0.25rem'}
									p={'0.5rem'}
									width={'fit-content'}
									borderRadius='md'
									variant='solid'
									colorScheme='gray'
									_hover={{ cursor: 'pointer' }}
									onClick={onClick}
								>
									<TagLabel>{'{{group_name}}'}</TagLabel>
								</Tag>
								<Tag
									size={'sm'}
									m={'0.25rem'}
									p={'0.5rem'}
									width={'fit-content'}
									borderRadius='md'
									variant='solid'
									colorScheme='gray'
									_hover={{ cursor: 'pointer' }}
									onClick={onClick}
								>
									<TagLabel>{'{{sender_number}}'}</TagLabel>
								</Tag>
								<Tag
									size={'sm'}
									m={'0.25rem'}
									p={'0.5rem'}
									width={'fit-content'}
									borderRadius='md'
									variant='solid'
									colorScheme='gray'
									_hover={{ cursor: 'pointer' }}
									onClick={onClick}
								>
									<TagLabel>{'{{timestamp}}'}</TagLabel>
								</Tag>
							</Flex>
							<Box>
								<AddOns
									attachments={creator_rule.attachments}
									shared_contact_cards={creator_rule.shared_contact_cards}
									polls={creator_rule.polls}
									onAttachmentsSelected={(ids) =>
										setCreatorRule((prev) => {
											return { ...prev, attachments: ids };
										})
									}
									onContactsSelected={(ids) =>
										setCreatorRule((prev) => {
											return { ...prev, shared_contact_cards: ids };
										})
									}
									onPollsSelected={(ids) =>
										setCreatorRule((prev) => {
											return { ...prev, polls: ids };
										})
									}
								/>
							</Box>
						</VStack>
					</Flex>
				</ModalBody>
				<ModalFooter gap={4}>
					<Button colorScheme='red'>Cancel</Button>
					<Button colorScheme='green' onClick={handleSave}>
						Save
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
});

export default MessageModerationRule;
