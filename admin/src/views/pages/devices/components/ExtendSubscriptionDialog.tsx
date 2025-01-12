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
import { useTheme } from '../../../../hooks/useTheme';

export type ExtendSubscriptionDialogHandle = {
	close: () => void;
	open: (id: string, subscription_expiry: string) => void;
};

type Props = {
	onConfirm: (id: string, month: string) => void;
};

const ExtendSubscriptionDialog = forwardRef<ExtendSubscriptionDialogHandle, Props>(
	({ onConfirm }: Props, ref) => {
		const theme = useTheme();
		const [isOpen, setOpen] = useState(false);
		const [id, setId] = useState('');
		const [date, setDate] = useState<string>('');
		const [minDate, setMinDate] = useState<string>('');
		const onClose = () => setOpen(false);
		const handleDelete = () => {
			onConfirm(id, date.split('-').join('/'));
			onClose();
		};

		useImperativeHandle(ref, () => ({
			close: () => {
				setOpen(false);
			},
			open: (id: string, subscription_expiry) => {
				setId(id);
				setDate(subscription_expiry.split('/').reverse().join('-'));
				setMinDate(subscription_expiry.split('/').reverse().join('-'));
				setOpen(true);
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
							Extend Subscription
						</AlertDialogHeader>

						<AlertDialogBody>
							<Text>Are you sure? You can't undo this action afterwards.</Text>
							<Input
								type='date'
								mt={'1rem'}
								variant='outline'
								placeholder={`eg. 1 or 12...`}
								value={date}
								onChange={(e) => setDate(e.target.value)}
								min={minDate}
							/>
						</AlertDialogBody>

						<AlertDialogFooter>
							<Button ref={cancelRef} onClick={onClose}>
								Cancel
							</Button>
							<Button
								colorScheme='green'
								onClick={handleDelete}
								isDisabled={date <= minDate}
								ml={3}
							>
								Extend
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
		);
	}
);

export default ExtendSubscriptionDialog;
