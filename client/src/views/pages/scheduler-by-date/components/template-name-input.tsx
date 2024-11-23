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
} from '@chakra-ui/react';
import React from 'react';

const InputDialog = ({
	isOpen,
	onConfirm,
	onClose,
}: {
	onClose: () => void;
	onConfirm: (text: string) => void;
	isOpen: boolean;
}) => {
	const [name, setName] = React.useState('');
	const cancelRef = React.useRef(null);
	return (
		<AlertDialog
			motionPreset='slideInBottom'
			leastDestructiveRef={cancelRef}
			onClose={() => {
				onClose();
				setName('');
			}}
			isOpen={isOpen}
			isCentered
		>
			<AlertDialogOverlay />

			<AlertDialogContent width={'80%'}>
				<AlertDialogHeader fontSize={'sm'}>Assign a name.</AlertDialogHeader>
				<AlertDialogCloseButton />
				<AlertDialogBody>
					<Input
						width={'full'}
						placeholder={'template name...'}
						border={'none'}
						className='text-black !bg-[#ECECEC] '
						_placeholder={{ opacity: 0.4, color: 'inherit' }}
						_focus={{ border: 'none', outline: 'none' }}
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</AlertDialogBody>
				<AlertDialogFooter>
					<Button ref={cancelRef} colorScheme='red' onClick={onClose} size={'sm'}>
						Cancel
					</Button>
					<Button colorScheme='green' onClick={() => onConfirm(name)} ml={3} size={'sm'}>
						Save
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default InputDialog;
