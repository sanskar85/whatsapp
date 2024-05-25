import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogCloseButton,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Button,
	Input,
	InputGroup,
	InputRightAddon,
	useDisclosure,
	useToast,
} from '@chakra-ui/react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import UsersService from '../../../../services/users.service';

export type ShareEmailInputDialogHandle = {
	close: () => void;
	open: (id: string) => void;
};

const ShareEmailInputDialog = forwardRef<ShareEmailInputDialogHandle>((_, ref) => {
	const cancelRef = useRef(null);
	const toast = useToast({ position: 'top', status: 'error' });
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [email, setEmail] = useState('');
	const [id, setID] = useState('');

	useImperativeHandle(ref, () => ({
		close: () => {
			onClose();
		},
		open: (id: string) => {
			setID(id);
			onOpen();
		},
	}));

	const handleSave = async () => {
		onClose();

		const success = await UsersService.shareMessageLogs(id, email + '@gmail.com');

		if (!success) {
			toast({
				title: 'Error',
				description: 'Failed to share the file',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		toast({
			title: 'File Shared',
			description: 'The file has been shared successfully',
			status: 'success',
			duration: 3000,
			isClosable: true,
		});
	};

	return (
		<AlertDialog
			motionPreset='slideInBottom'
			leastDestructiveRef={cancelRef}
			onClose={onClose}
			isOpen={isOpen}
			isCentered
		>
			<AlertDialogOverlay />

			<AlertDialogContent>
				<AlertDialogHeader>Enter email address</AlertDialogHeader>
				<AlertDialogCloseButton />
				<AlertDialogBody>
					<InputGroup variant={'outline'} marginTop={'1rem'}>
						<Input value={email} onChange={(e) => setEmail(e.target.value)} />
						<InputRightAddon pointerEvents='none'>@gmail.com</InputRightAddon>
					</InputGroup>
				</AlertDialogBody>
				<AlertDialogFooter>
					<Button ref={cancelRef} onClick={onClose}>
						Cancel
					</Button>
					<Button colorScheme='green' isDisabled={!email} ml={3} onClick={handleSave}>
						Share
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
});

export default ShareEmailInputDialog;
