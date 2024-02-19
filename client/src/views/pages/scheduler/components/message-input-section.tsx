import { AddIcon, EditIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Flex,
	FormControl,
	FormErrorMessage,
	HStack,
	IconButton,
	Select,
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
import { setMessage, setMessageError } from '../../../../store/reducers/SchedulerReducer';
import Variables from '../../../components/variables';

type Props = {
	textAreaProps?: TextareaProps;
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
			</Box>
			<FormControl isInvalid={messageError}>
				<Textarea
					width={'full'}
					minHeight={'160px'}
					size={'sm'}
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
				<FormErrorMessage>Message, attachment, contact card or poll is required </FormErrorMessage>
			)}

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
		</Flex>
	);
}
