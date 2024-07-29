import { AddIcon, EditIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Checkbox,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	HStack,
	IconButton,
	Select,
	Switch,
	Tag,
	TagLabel,
	Text,
	Textarea,
	TextareaProps,
	useDisclosure,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { TemplateNameInputDialog } from '.';
import useTemplate from '../../../../hooks/useTemplate';
import { StoreNames, StoreState } from '../../../../store';
import {
	setMessage,
	setMessageError,
	toggleRandomString,
} from '../../../../store/reducers/SchedulerReducer';
import Variables from '../../../components/variables';
import { TextAreaElement } from '../../bot/components/Inputs';

type Props = {
	textAreaProps?: TextareaProps;
	isAlertMessage: boolean;
	setIsAlertMessage: (value: boolean) => void;
	readMoreDetails: {
		title: string;
		message: string;
	};
	setReadMoreDetails: (value: { title: string; message: string }) => void;
	handleReadMoreInput: (type: string, value: string) => void;
};

export default function MessageSection(props: Props) {
	const dispatch = useDispatch();

	const [selectedTemplate, setSelectedTemplate] = useState({
		id: '',
		name: '',
	});

	const messageRef = useRef(0);
	const {
		templates,
		add: addToTemplate,
		addingTemplate,
		update: updateTemplate,
		remove: removeTemplate,
	} = useTemplate('message');

	const {
		isOpen: isNameInputOpen,
		onOpen: openNameInput,
		onClose: closeNameInput,
	} = useDisclosure();

	const {
		details,
		ui: { messageError },
	} = useSelector((state: StoreState) => state[StoreNames.SCHEDULER]);

	const insertVariablesToMessage = (variable: string) => {
		dispatch(
			setMessage(
				details.message.substring(0, messageRef.current) +
					variable +
					details.message.substring(messageRef.current ?? 0, details.message.length)
			)
		);
	};

	return (
		<Flex direction={'column'} flex={1} gap={'0.5rem'}>
			<Box justifyContent={'space-between'}>
				<Text className='text-gray-700 dark:text-white' pb={2} fontWeight={'medium'}>
					Message Section
				</Text>
				<FormControl display={'flex'} mt={'1rem'}>
					<FormLabel className='dark:text-gray-400' mb={0}>
						Read more
					</FormLabel>
					<Switch
						colorScheme='green'
						checked={props.isAlertMessage}
						onChange={(e) => props.setIsAlertMessage(e.target.checked)}
					/>
				</FormControl>
				<Box hidden={!props.isAlertMessage}>
					<FormControl>
						<FormLabel className='dark:text-gray-400'>Title</FormLabel>
						<TextAreaElement
							isInvalid={false}
							onChange={(e) => props.handleReadMoreInput('title', e.target.value)}
							placeholder='eg. ALERT'
							value={props.readMoreDetails.title}
						/>
					</FormControl>
					<FormControl>
						<FormLabel className='dark:text-gray-400'>Message</FormLabel>
						<TextAreaElement
							isInvalid={false}
							onChange={(e) => props.handleReadMoreInput('message', e.target.value)}
							placeholder='eg. You are invited to fanfest'
							value={props.readMoreDetails.message}
						/>
					</FormControl>
				</Box>
			</Box>
			<Box hidden={props.isAlertMessage}>
				<Text className='text-gray-700 dark:text-gray-400' size={'sm'}>
					Write a message or select from a template
				</Text>
				<Flex gap={3} alignItems={'center'}>
					<Select
						className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
						border={'none'}
						rounded={'md'}
						onChange={(e) => {
							dispatch(setMessage(e.target.value));
							dispatch(setMessageError(false));
							setSelectedTemplate({
								id: e.target[e.target.selectedIndex].getAttribute('data-id') ?? '',
								name: e.target[e.target.selectedIndex].getAttribute('data-name') ?? '',
							});
						}}
					>
						<option
							className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
							value={''}
						>
							Select template!
						</option>
						{(templates ?? []).map(({ name, message, id }, index) => (
							<option
								className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
								value={message}
								key={index}
								data-id={id}
								data-name={name}
							>
								{name}
							</option>
						))}
					</Select>
					<HStack>
						<Button
							width={'200px'}
							colorScheme='green'
							aria-label='Add Template'
							rounded={'md'}
							isLoading={addingTemplate}
							leftIcon={<AddIcon />}
							onClick={() => {
								if (!details.message) return;
								openNameInput();
							}}
							fontSize={'sm'}
							px={4}
						>
							Add Template
						</Button>
						<IconButton
							aria-label='Edit'
							icon={<EditIcon />}
							color={'yellow.600'}
							isDisabled={!selectedTemplate.id}
							onClick={() =>
								updateTemplate(selectedTemplate.id, {
									name: selectedTemplate.name,
									message: details.message,
								})
							}
						/>
						<IconButton
							aria-label='Delete'
							icon={<MdDelete />}
							color={'red.400'}
							isDisabled={!selectedTemplate.id}
							onClick={() => removeTemplate(selectedTemplate.id)}
						/>
					</HStack>
				</Flex>
				<FormControl isInvalid={messageError}>
					<Textarea
						width={'full'}
						minHeight={'160px'}
						size={'sm'}
						mt={'1rem'}
						rounded={'md'}
						placeholder={
							details.type === 'CSV'
								? 'Type your message here. \nex. Hello {{name}}, you are invited to join fan-fest on {{date}}'
								: 'Type your message here. \nex. You are invited to join fan-fest'
						}
						border={'none'}
						className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
						_placeholder={{
							opacity: 0.4,
							color: 'inherit',
						}}
						_focus={{ border: 'none', outline: 'none' }}
						value={details.message ?? ''}
						onMouseUp={(e: React.MouseEvent<HTMLTextAreaElement, MouseEvent>) => {
							if (e.target instanceof HTMLTextAreaElement) {
								messageRef.current = e.target.selectionStart;
							}
						}}
						onChange={(e) => {
							messageRef.current = e.target.selectionStart;
							dispatch(setMessageError(false));
							dispatch(setMessage(e.target.value));
						}}
						{...props.textAreaProps}
					/>
				</FormControl>
				{messageError && (
					<FormErrorMessage>
						Message, attachment, contact card or poll is required{' '}
					</FormErrorMessage>
				)}
				<HStack justifyContent={'space-between'}>
					<Tag
						size={'sm'}
						m={'0.25rem'}
						p={'0.5rem'}
						width={'fit-content'}
						borderRadius='md'
						variant='solid'
						colorScheme='gray'
						_hover={{ cursor: 'pointer' }}
						onClick={() => insertVariablesToMessage('{{public_name}}')}
						hidden={true}
					>
						<TagLabel>{'{{public_name}}'}</TagLabel>
					</Tag>
					<Checkbox
						colorScheme='green'
						size='md'
						isChecked={details.random_string}
						onChange={() => dispatch(toggleRandomString())}
					>
						Append Random Text
					</Checkbox>
				</HStack>
				<Box hidden={details.type !== 'CSV'}>
					<Text className='text-gray-700 dark:text-white' hidden={details.variables.length === 0}>
						Variables
					</Text>
					<Box>
						<Variables data={details.variables} onVariableSelect={insertVariablesToMessage} />
					</Box>
				</Box>
				<TemplateNameInputDialog
					isOpen={isNameInputOpen}
					onClose={closeNameInput}
					onConfirm={(name) => {
						if (!details.message) return;
						addToTemplate({ name, message: details.message });
						closeNameInput();
					}}
				/>
			</Box>
		</Flex>
	);
}
