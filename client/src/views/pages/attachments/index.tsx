import { EditIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Checkbox,
	HStack,
	Icon,
	IconButton,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { IoIosCloudDownload } from 'react-icons/io';
import { MdOutlineAttachment } from 'react-icons/md';
import { RiAttachment2 } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { NAVIGATION } from '../../../config/const';
import useFilteredList from '../../../hooks/useFilteredList';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import AttachmentService from '../../../services/attachment.service';
import { StoreNames, StoreState } from '../../../store';
import {
	clearSelectedAttachment,
	clearSelectedAttachments,
	deleteAttachment,
	findAttachmentById,
	selectAllAttachments,
	startAttachmentDeleting,
	startAttachmentUpdating,
	toggleSelected,
} from '../../../store/reducers/AttachmentReducers';
import DeleteAlert, { DeleteAlertHandle } from '../../components/delete-alert';
import { NavbarDeleteElement, NavbarSearchElement } from '../../components/navbar';
import AttachmentDetailsInputDialog, {
	AttachmentDetailsInputDialogHandle,
} from './components/attachment-details-input-dialog';

const AttachmentPage = () => {
	const dispatch = useDispatch();
	const theme = useTheme();
	const AttachmentDetailsInputRef = React.useRef<AttachmentDetailsInputDialogHandle>(null);
	const deleteAlertRef = React.useRef<DeleteAlertHandle>(null);
	const {
		attachments,
		uiDetails: { isDeleting },
		selectedAttachments,
	} = useSelector((state: StoreState) => state[StoreNames.ATTACHMENT]);

	const filtered = useFilteredList(attachments, { name: 1 });

	useEffect(() => {
		pushToNavbar({
			title: 'Attachments',
			icon: RiAttachment2,
			link: NAVIGATION.ATTACHMENTS,
			actions: (
				<HStack>
					<NavbarSearchElement />
					<NavbarDeleteElement
						isLoading={isDeleting}
						isDisabled={selectedAttachments.length === 0}
						onClick={() => deleteAlertRef.current?.open('')}
					/>
					<Button
						leftIcon={<Icon as={MdOutlineAttachment} height={5} width={5} />}
						colorScheme={'green'}
						size={'sm'}
						onClick={() => {
							AttachmentDetailsInputRef.current?.open();
						}}
					>
						ADD
					</Button>
					<Button colorScheme='blue' size={'sm'} onClick={() => dispatch(selectAllAttachments())}>
						Select All
					</Button>
				</HStack>
			),
		});
		return () => {
			popFromNavbar();
		};
	}, [dispatch, isDeleting, selectedAttachments.length]);

	const handleDeleteAttachments = async () => {
		dispatch(startAttachmentDeleting());
		selectedAttachments.forEach(async (attachment_id) => {
			AttachmentService.deleteAttachment(attachment_id);
			dispatch(deleteAttachment(attachment_id as string));
		});
		dispatch(clearSelectedAttachment());
		dispatch(clearSelectedAttachments());
	};

	const handleAttachmentDetailsEdit = (id: string) => {
		dispatch(startAttachmentUpdating());
		dispatch(findAttachmentById({ id }));
		AttachmentDetailsInputRef.current?.open();
	};

	const downloadFile = (id: string) => {
		AttachmentService.downloadAttachment(id);
	};

	return (
		<Box py={'1rem'}>
			<AttachmentDetailsInputDialog ref={AttachmentDetailsInputRef} />
			<TableContainer pt={'0.5rem'} textColor={theme === 'dark' ? 'white' : 'black'}>
				<Table>
					<Thead>
						<Tr>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Sl no
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'20%'}>
								Name
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'60%'}>
								Caption
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Custom Caption
							</Th>
							<Th
								color={theme === 'dark' ? 'whitesmoke' : 'gray'}
								width={'10%'}
								textAlign={'center'}
							>
								Actions
							</Th>
						</Tr>
					</Thead>
					<Tbody>
						{filtered.map((attachment, index) => (
							<Tr key={index} verticalAlign={'middle'}>
								<Td>
									<Checkbox
										colorScheme='green'
										mr={2}
										isChecked={selectedAttachments.includes(attachment.id)}
										onChange={() => dispatch(toggleSelected(attachment.id))}
									/>
									{index + 1}.
								</Td>
								<Td>{attachment.name}</Td>
								<Td className='whitespace-break-spaces'>{attachment.caption}</Td>
								<Td textAlign={'center'}>{attachment.custom_caption ? 'Yes' : 'No'}</Td>
								<Td>
									<HStack>
										<IconButton
											aria-label='Edit'
											icon={<Icon as={EditIcon} height={5} width={5} />}
											onClick={() => handleAttachmentDetailsEdit(attachment.id)}
										/>
										<Box as='span'>
											<IconButton
												aria-label='change file'
												icon={<Icon as={IoIosCloudDownload} height={5} width={5} />}
												onClick={() => downloadFile(attachment.id)}
											/>
										</Box>
									</HStack>
								</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			</TableContainer>
			<DeleteAlert
				type={'Attachments'}
				ref={deleteAlertRef}
				onConfirm={handleDeleteAttachments}
				disclaimer='Any scheduled messaged containing this attachment will not be sent'
			/>
		</Box>
	);
};

export default AttachmentPage;
