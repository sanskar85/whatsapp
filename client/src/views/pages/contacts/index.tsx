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
	Tooltip,
	Tr,
} from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { MdContactPage, MdContacts } from 'react-icons/md';
import { TbDatabaseExport } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { NAVIGATION } from '../../../config/const';
import useFilteredList from '../../../hooks/useFilteredList';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import ContactCardService from '../../../services/contact-card.service';
import { StoreNames, StoreState } from '../../../store';
import {
	addSelectedContact,
	deleteContactCard,
	deletingContactCard,
	findContactById,
	removeAllSelectedContacts,
	removeSelectedContact,
	selectAllContacts,
	updatingContactCard,
} from '../../../store/reducers/ContactCardReducers';
import DeleteAlert, { DeleteAlertHandle } from '../../components/delete-alert';
import ExporterModal, { ExportsModalHandler } from '../../components/exporter';
import { NavbarDeleteElement, NavbarSearchElement } from '../../components/navbar';
import QRImage from '../../components/qr-image/QRImage';
import ContactInputDialog, { ContactInputDialogHandle } from './components/contact-input-dialog';

const ContactsPage = () => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);

	const { list, selectedContacts } = useSelector(
		(state: StoreState) => state[StoreNames.CONTACT_CARD]
	);
	const drawerRef = useRef<ContactInputDialogHandle>(null);
	const exporterRef = useRef<ExportsModalHandler>(null);

	const handleDeleteContacts = async () => {
		dispatch(deletingContactCard());
		selectedContacts.forEach(async (contact) => {
			ContactCardService.DeleteContacts(contact);
			dispatch(deleteContactCard(contact));
		});
		dispatch(removeAllSelectedContacts());
	};

	const handleContactEdit = (id: string) => {
		dispatch(findContactById(id));
		dispatch(updatingContactCard());
		drawerRef.current?.open();
	};

	useEffect(() => {
		pushToNavbar({
			title: 'Contacts',
			icon: MdContacts,
			link: NAVIGATION.CONTACT,
			actions: (
				<HStack>
					<NavbarSearchElement />
					<Button
						leftIcon={<Icon as={TbDatabaseExport} height={5} width={5} />}
						colorScheme={'blue'}
						size={'sm'}
						onClick={() => exporterRef.current?.open()}
					>
						EXPORT
					</Button>
					<NavbarDeleteElement
						isDisabled={selectedContacts.length === 0}
						onClick={() => deleteAlertRef.current?.open('')}
					/>
					<Button
						leftIcon={<Icon as={MdContactPage} height={5} width={5} />}
						colorScheme={'green'}
						size={'sm'}
						onClick={() => drawerRef.current?.open()}
					>
						ADD
					</Button>
					<Button colorScheme='blue' size={'sm'} onClick={() => dispatch(selectAllContacts())}>
						Select All
					</Button>
				</HStack>
			),
		});
		return () => {
			popFromNavbar();
		};
	}, [dispatch, selectedContacts.length]);

	const filtered = useFilteredList(list, { first_name: 1, middle_name: 1, last_name: 1 });

	return (
		<Box py={'1rem'} textColor={theme === 'dark' ? 'white' : 'black'}>
			<TableContainer pt={'0.5rem'}>
				<Table>
					<Thead>
						<Tr>
							<Th width={'5%'}>Sl no</Th>
							<Th width={'15%'}>QR</Th>
							<Th width={'30%'}>Name</Th>
							<Th width={'10%'}>Personal Number</Th>
							<Th width={'10%'}>Work Number</Th>
							<Th width={'20%'}>Email</Th>
							<Th width={'10%'}>Edit</Th>
						</Tr>
					</Thead>
					<Tbody>
						{filtered.map((contact, index) => (
							<Tr key={index}>
								<Td>
									<Checkbox
										colorScheme='green'
										mr={2}
										isChecked={selectedContacts.includes(contact.id)}
										onChange={(e) => {
											if (e.target.checked) {
												dispatch(addSelectedContact(contact.id));
											} else {
												dispatch(removeSelectedContact(contact.id));
											}
										}}
									/>
									{index + 1}.
								</Td>
								<Td>
									<QRImage base64={contact.base64} />
								</Td>
								<Td>
									<Box>
										{contact.first_name} {contact.middle_name} {contact.last_name}
									</Box>
								</Td>
								<Td>{contact.contact_details_phone?.number}</Td>
								<Td>{contact.contact_details_work?.number}</Td>
								<Td>{contact.email_personal}</Td>
								<Td>
									<Tooltip label='Edit Contact Details' aria-label='Edit Contact Details'>
										<IconButton
											aria-label='Edit'
											icon={<Icon as={EditIcon} />}
											onClick={() => handleContactEdit(contact.id)}
										/>
									</Tooltip>
								</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			</TableContainer>
			<ContactInputDialog ref={drawerRef} />
			<ExporterModal ref={exporterRef} />
			<DeleteAlert type={'Contacts'} ref={deleteAlertRef} onConfirm={handleDeleteContacts} />
		</Box>
	);
};

export default ContactsPage;
