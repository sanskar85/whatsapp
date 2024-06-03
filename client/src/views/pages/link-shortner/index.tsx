import {
	Box,
	Button,
	ComponentWithAs,
	Flex,
	HStack,
	Icon,
	IconButton,
	IconProps,
	Input,
	Skeleton,
	SkeletonCircle,
	SkeletonText,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tooltip,
	Tr,
	useDisclosure,
	useToast,
} from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
// import TextToQR from '../../../helpers/qr-generator/textToQR';
import { CopyIcon, DeleteIcon, EditIcon, LinkIcon } from '@chakra-ui/icons';
import { useDispatch, useSelector } from 'react-redux';
import { NAVIGATION } from '../../../config/const';
import useFilteredList from '../../../hooks/useFilteredList';
import { popFromNavbar, pushToNavbar } from '../../../hooks/useNavbar';
import { useTheme } from '../../../hooks/useTheme';
import ShortenerService from '../../../services/shortener.service';
import { StoreNames, StoreState } from '../../../store';
import {
	clearCreateDetails,
	deleteShortenLink,
	setLinkCopied,
	updateShortenLink,
} from '../../../store/reducers/LinkShortnerReducers';
import DeleteAlert, { DeleteAlertHandle } from '../../components/delete-alert';
import { NavbarSearchElement } from '../../components/navbar';
import QRImage from '../../components/qr-image/QRImage';
import CreateLinkDrawer, { CreateLinkDrawerHandle } from './components/CreateLinkDrawer';
import EditLinkDialog, { EditLinkDialogHandle } from './components/editLinkDialog';
import GeneratedResultDialog from './components/generatedResultDialog';

const LinkShortner = () => {
	const dispatch = useDispatch();
	const theme = useTheme();
	const toast = useToast();
	const deleteAlertRef = useRef<DeleteAlertHandle>(null);
	const editLinkDialogRef = useRef<EditLinkDialogHandle>(null);
	const drawerRef = useRef<CreateLinkDrawerHandle>(null);

	const {
		list,
		generation_result: { generated_image, generated_link },
		ui: { link_copied, loading_links },
	} = useSelector((state: StoreState) => state[StoreNames.LINK]);

	const {
		isOpen: isLinkGenerated,
		onOpen: successfulLinkGenerated,
		onClose: closeGeneratedModal,
	} = useDisclosure();

	useEffect(() => {
		pushToNavbar({
			title: 'Link Shortener',
			icon: LinkIcon,
			link: NAVIGATION.SHORT,
			actions: (
				<HStack>
					<NavbarSearchElement />
					<Button
						leftIcon={<LinkIcon />}
						colorScheme='whatsapp'
						size={'sm'}
						onClick={() => {
							dispatch(clearCreateDetails());
							drawerRef.current?.open();
						}}
					>
						Create a Link
					</Button>
				</HStack>
			),
		});
		return () => {
			popFromNavbar();
		};
	}, [dispatch]);

	const deleteLink = async (id: string) => {
		await ShortenerService.deleteLink(id);
		dispatch(deleteShortenLink(id));
	};

	const editLink = async (id: string, newLink: string, newTitle: string) => {
		const data = await ShortenerService.updateLink(id, newLink, newTitle);
		if (!data) {
			toast({
				title: 'Error',
				description: 'Error updating link',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		toast({
			title: 'Success',
			description: 'Link updated successfully',
			status: 'success',
			duration: 3000,
			isClosable: true,
		});
		dispatch(updateShortenLink({ id, data }));
		editLinkDialogRef.current?.close();
	};

	useEffect(() => {
		setTimeout(() => {
			dispatch(setLinkCopied(false));
		}, 5000);
	}, [link_copied, dispatch]);

	const filtered = useFilteredList(list, { title: 1 });

	return (
		<Box p={8}>
			<CreateLinkDrawer ref={drawerRef} onSuccess={() => successfulLinkGenerated()} />

			<TableContainer flex={2}>
				<Table>
					<Thead>
						<Tr>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Sl. no
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'15%'}>
								Qr Code
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'20%'}>
								Title
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'25%'}>
								link
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'25%'}>
								shorten link
							</Th>
							<Th color={theme === 'dark' ? 'whitesmoke' : 'gray'} width={'5%'}>
								Action
							</Th>
						</Tr>
					</Thead>
					<Tbody>
						{loading_links && list.length === 0 ? (
							<Tr
								bg={theme === 'light' ? 'gray.50' : 'gray.700'}
								color={theme === 'dark' ? 'white' : 'black'}
							>
								<Td>
									<SkeletonCircle size='10' />
								</Td>
								<Td>
									<Skeleton height='125px' width='125px' ml='1rem'>
										<Box>LOREM</Box>
									</Skeleton>
								</Td>
								<Td>
									<LineSkeleton />
								</Td>

								<Td>
									<LineSkeleton />
								</Td>
								<Td>
									<Flex>
										<BoxSkeleton />
										<BoxSkeleton />
										<BoxSkeleton />
									</Flex>
								</Td>
							</Tr>
						) : (
							filtered.map((item, index) => (
								<Tr key={index} textColor={theme === 'dark' ? 'white' : 'black'}>
									<Td>{index + 1}.</Td>
									<Td>
										<QRImage base64={item.base64} />
									</Td>
									<Td>{item.title ?? 'No title'}</Td>
									<Td>
										<Input value={item.link} isReadOnly size={'sm'} />
									</Td>
									<Td>
										<Input value={item.shorten_link} isReadOnly size={'sm'} />
									</Td>
									<Td>
										<ActionButton
											label='Copy Link'
											activeBackgroundColor='gray.100'
											icon={CopyIcon}
											onClick={() => navigator.clipboard.writeText(item.shorten_link)}
											color={theme === 'dark' ? 'white' : 'black'}
										/>
										<ActionButton
											label='Edit Link'
											activeBackgroundColor='yellow.100'
											icon={EditIcon}
											onClick={() => {
												editLinkDialogRef.current?.open({
													id: item.id,
													link: item.link,
													shortLink: item.shorten_link,
													title: item.title,
												});
											}}
											color={theme === 'dark' ? 'yellow.200' : 'yellow.500'}
										/>
										<ActionButton
											label='Delete Link'
											isHidden
											activeBackgroundColor='red.100'
											icon={DeleteIcon}
											onClick={() => {
												deleteAlertRef.current?.open(item.id);
											}}
											color={'red.500'}
										/>
									</Td>
								</Tr>
							))
						)}
					</Tbody>
				</Table>
			</TableContainer>
			<GeneratedResultDialog
				isOpen={isLinkGenerated}
				onClose={closeGeneratedModal}
				image={generated_image}
				link={generated_link}
			/>
			<DeleteAlert ref={deleteAlertRef} type={'Link'} onConfirm={deleteLink} />
			<EditLinkDialog ref={editLinkDialogRef} onConfirm={editLink} />
		</Box>
	);
};

type ActionButtonProps = {
	icon: ComponentWithAs<'svg', IconProps>;
	onClick: () => void;
	activeBackgroundColor: string;
	color: string;
	isHidden?: boolean;
	label: string;
};
function ActionButton({
	icon,
	onClick,
	color,
	activeBackgroundColor,
	isHidden = false,
	label,
}: ActionButtonProps) {
	return (
		<Tooltip label={label} aria-label={label}>
			<IconButton
				backgroundColor={'transparent'}
				border={'none'}
				outline={'none'}
				_hover={{
					backgroundColor: 'transparent',
					border: 'none',
					outline: 'none',
				}}
				_active={{
					backgroundColor: activeBackgroundColor,
					border: 'none',
					outline: 'none',
				}}
				aria-label='action-button'
				icon={<Icon as={icon} />}
				onClick={onClick}
				color={color}
				hidden={isHidden}
				zIndex={1}
			/>
		</Tooltip>
	);
}

function LineSkeleton() {
	return <SkeletonText mt='4' noOfLines={1} spacing='4' skeletonHeight='4' rounded={'md'} />;
}

function BoxSkeleton() {
	return (
		<Skeleton height='15px' width='15px' ml='1rem'>
			<Box>LOREM</Box>
		</Skeleton>
	);
}

export default LinkShortner;
