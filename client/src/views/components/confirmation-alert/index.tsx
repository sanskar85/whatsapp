import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Button,
	Text,
} from '@chakra-ui/react';
import React, { RefObject, forwardRef, useImperativeHandle, useState } from 'react';
import { useTheme } from '../../../hooks/useTheme';

export type ConfirmationAlertHandle = {
	close: () => void;
	open: (details?: { id?: string; disclaimer?: string; type?: string }) => void;
};

type Props = {
	onConfirm: (id: string, type: string) => void;
	disclaimer: string;
	confirmText?: string;
	secondaryText?: string;
	secondaryAction?: () => void;
	cancelButton?: boolean;
};

const ConfirmationAlert = forwardRef<ConfirmationAlertHandle, Props>(
	(
		{
			onConfirm,
			disclaimer,
			confirmText,
			secondaryText,
			secondaryAction,
			cancelButton = true,
		}: Props,
		ref
	) => {
		const theme = useTheme();
		const [isOpen, setOpen] = useState(false);
		const [id, setId] = useState('');
		const [_disclaimer, setDisclaimer] = useState('');
		const [type, setType] = useState('');
		const onClose = () => {
			setOpen(false);
			setDisclaimer('');
			setId('');
			setType('');
		};
		const handleConfirm = () => {
			onConfirm(id, type);
			onClose();
		};

		const handleSecondaryAction = () => {
			if (secondaryAction) {
				secondaryAction();
			}
			onClose();
		};

		useImperativeHandle(ref, () => ({
			close: () => onClose(),
			open: (details = {}) => {
				setId(details.id || '');
				setType(details.type || '');
				setOpen(true);
				setDisclaimer(details.disclaimer || disclaimer);
			},
		}));

		const cancelRef = React.useRef() as RefObject<HTMLButtonElement>;

		return (
			<AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} size={'2xl'}>
				<AlertDialogOverlay>
					<AlertDialogContent
						backgroundColor={theme === 'dark' ? '#252525' : 'white'}
						textColor={theme === 'dark' ? 'white' : 'black'}
					>
						<AlertDialogHeader fontSize='lg' fontWeight='bold'>
							Alert
						</AlertDialogHeader>

						<AlertDialogBody>
							<Text>{_disclaimer}</Text>
						</AlertDialogBody>

						<AlertDialogFooter className='flex gap-2'>
							{cancelButton && (
								<Button ref={cancelRef} onClick={onClose} ml={'auto'}>
									Cancel
								</Button>
							)}
							{secondaryText && secondaryAction && (
								<Button colorScheme='yellow' onClick={handleSecondaryAction}>
									{secondaryText}
								</Button>
							)}
							<Button colorScheme='blue' onClick={handleConfirm}>
								{confirmText ? confirmText : 'Continue'}
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
		);
	}
);

export default ConfirmationAlert;
