import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Button,
	IconButton,
	Input,
	InputGroup,
	InputRightElement,
	Text,
} from '@chakra-ui/react';
import React, { RefObject, forwardRef, useImperativeHandle, useState } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useTheme } from '../../../../hooks/useTheme';
import AuthService from '../../../../services/auth.service';

export type ChangePasswordHandle = {
	close: () => void;
	open: () => void;
};

const ChangePassword = forwardRef<ChangePasswordHandle>((_, ref) => {
	const theme = useTheme();
	const [isOpen, setOpen] = useState(false);
	const [password, setPassword] = useState('' as string);
	const [passwordVisible, setPasswordVisibility] = useState(true);
	const onClose = () => {
		AuthService.updatePassword(password);
		setOpen(false);
		setPassword('');
	};
	const handleDelete = () => {
		onClose();
	};

	useImperativeHandle(ref, () => ({
		close: () => {
			setOpen(false);
		},
		open: () => {
			setOpen(true);
		},
	}));

	const onClickReveal = () => {
		setPasswordVisibility((prev) => !prev);
	};

	const cancelRef = React.useRef() as RefObject<HTMLButtonElement>;

	return (
		<AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
			<AlertDialogOverlay />
			<AlertDialogContent
				backgroundColor={theme === 'dark' ? '#252525' : 'white'}
				textColor={theme === 'dark' ? 'white' : 'black'}
			>
				<AlertDialogHeader fontSize='lg' fontWeight='bold'>
					Change Password
				</AlertDialogHeader>

				<AlertDialogBody>
					<Text>
						Are you sure?
						<Text as='span' color='tomato' mx={'0.25rem'}>
							This action is irreversible.
						</Text>
					</Text>

					<InputGroup mt={'1rem'}>
						<InputRightElement>
							<IconButton
								variant='text'
								aria-label={isOpen ? 'Mask password' : 'Reveal password'}
								icon={passwordVisible ? <HiEyeOff /> : <HiEye />}
								onClick={onClickReveal}
							/>
						</InputRightElement>
						<Input
							type={passwordVisible ? 'text' : 'password'}
							autoComplete='current-password'
							variant='outline'
							placeholder={`New Password (min 8 characters)`}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</InputGroup>
				</AlertDialogBody>

				<AlertDialogFooter>
					<Button ref={cancelRef} onClick={onClose}>
						Cancel
					</Button>
					<Button
						colorScheme='yellow'
						onClick={handleDelete}
						isDisabled={password.length < 8}
						ml={3}
					>
						Update
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
});

export default ChangePassword;
