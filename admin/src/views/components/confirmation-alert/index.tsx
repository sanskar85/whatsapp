import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Button,
	Input,
	Text,
} from '@chakra-ui/react';
import React, { RefObject, forwardRef, useImperativeHandle, useState } from 'react';
import { useTheme } from '../../../hooks/useTheme';

export type ConfirmationDialogHandle = {
	close: () => void;
	open: (id?: string) => void;
};

type Props = {
	onConfirm: (id: string) => void;
	type: string;
};

const ConfirmationDialog = forwardRef<ConfirmationDialogHandle, Props>(
	({ onConfirm, type }: Props, ref) => {
		const theme = useTheme();
		const [isOpen, setOpen] = useState(false);
		const [id, setId] = useState('' as string);
		const [confirm, setConfirm] = useState('' as string);
		const onClose = () => setOpen(false);
		const handleDelete = () => {
			onConfirm(id);
			onClose();
		};

		useImperativeHandle(ref, () => ({
			close: () => {
				setOpen(false);
			},
			open: (id: string = '') => {
				setId(id);
				setOpen(true);
				setConfirm('');
			},
		}));

		const cancelRef = React.useRef() as RefObject<HTMLButtonElement>;

		return (
			<AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
				<AlertDialogOverlay>
					<AlertDialogContent
						backgroundColor={theme === 'dark' ? '#252525' : 'white'}
						textColor={theme === 'dark' ? 'white' : 'black'}
					>
						<AlertDialogHeader fontSize='lg' fontWeight='bold'>
							{type.includes('Logout') ? '' : 'Delete'} {type}
						</AlertDialogHeader>

						<AlertDialogBody>
							<Text>Are you sure? You can't undo this action afterwards.</Text>
							<Input
								mt={'1rem'}
								variant='outline'
								placeholder={`Delete ${type}`}
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
							/>
						</AlertDialogBody>

						<AlertDialogFooter>
							<Button ref={cancelRef} onClick={onClose}>
								Cancel
							</Button>
							<Button
								colorScheme='red'
								onClick={handleDelete}
								isDisabled={
									type.includes('Logout') ? confirm !== type : confirm !== `Delete ${type}`
								}
								ml={3}
							>
								{type.includes('Logout') ? 'Logout User' : `Delete ${type}`}
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
		);
	}
);

export default ConfirmationDialog;
