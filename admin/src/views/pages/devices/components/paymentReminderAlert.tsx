import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Button,
	Text,
	Textarea,
} from '@chakra-ui/react';
import { RefObject, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useTheme } from '../../../../hooks/useTheme';

export type PaymentReminderDialogHandle = {
	close: () => void;
	open: (id: string) => void;
};

type Props = {
	onConfirm: (id: string, message: string) => void;
};

const PaymentReminderAlert = forwardRef<PaymentReminderDialogHandle, Props>(
	({ onConfirm }: Props, ref) => {
		const theme = useTheme();
		const [isOpen, setOpen] = useState(false);
		const [id, setId] = useState('');
		const [message, setMessage] = useState<string>(
			localStorage.getItem('paymentReminderMessage') ||
				'Hi {{profile_name}}\r\n\r\nYour subscription is due for renewal. Please make the payment at the earliest.\r\n\r\nThanks,\r\n{{company_name}}'
		);
		const onClose = () => setOpen(false);
		const handleSendReminder = () => {
            localStorage.setItem('paymentReminderMessage', message);
			onConfirm(id, message);
			onClose();
		};

		useImperativeHandle(ref, () => ({
			close: () => {
				setOpen(false);
			},
			open: (id: string) => {
				setId(id);
				setOpen(true);
			},
		}));

		const cancelRef = useRef() as RefObject<HTMLButtonElement>;

		return (
			<AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
				<AlertDialogOverlay>
					<AlertDialogContent
						backgroundColor={theme === 'dark' ? '#252525' : 'white'}
						textColor={theme === 'dark' ? 'white' : 'black'}
					>
						<AlertDialogHeader fontSize='lg' fontWeight='bold'>
							Payment Reminder
						</AlertDialogHeader>
						<AlertDialogBody>
							<Text fontSize='md' pb={'1rem'}>
								Send a payment reminder
							</Text>
							<Textarea
								placeholder='Enter message'
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								rows={10}
							/>
						</AlertDialogBody>
						<AlertDialogFooter>
							<Button ref={cancelRef} onClick={onClose}>
								Cancel
							</Button>
							<Button colorScheme='red' onClick={handleSendReminder} ml={3}>
								Send Reminder
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
		);
	}
);

export default PaymentReminderAlert;
