import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Box,
	Button,
	FormLabel,
	HStack,
	Input,
	Select,
} from '@chakra-ui/react';
import React, { RefObject, forwardRef, useImperativeHandle, useState } from 'react';
import { useTheme } from '../../../../hooks/useTheme';

export type BusinessLeadsDialogHandle = {
	close: () => void;
	open: (type: 'ALL' | 'GROUP_ALL' | 'GROUP_ADMINS') => void;
};

type Props = {
	onConfirm: ({
		type,
		page,
		limit,
	}: {
		type: 'ALL' | 'GROUP_ALL' | 'GROUP_ADMINS';
		page: string;
		limit: string;
	}) => void;
};

const BusinessLeadsDialog = forwardRef<BusinessLeadsDialogHandle, Props>(({ onConfirm }, ref) => {
	const theme = useTheme();
	const [isOpen, setOpen] = useState(false);
	const [type, setType] = useState('' as 'ALL' | 'GROUP_ALL' | 'GROUP_ADMINS');
	const [page, setConfirm] = useState<string>('');
	const [limit, setTotal] = useState('1000');
	const onClose = () => setOpen(false);
	const handleExport = () => {
		onConfirm({ type, page, limit });
		onClose();
	};

	useImperativeHandle(ref, () => ({
		close: () => {
			setOpen(false);
		},
		open: (type: 'ALL' | 'GROUP_ALL' | 'GROUP_ADMINS') => {
			setType(type);
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
					<AlertDialogHeader fontSize='lg' fontWeight='bold' className='capitalize'>
						{type.split('_').join(' ').toLocaleLowerCase()} Leads Details
					</AlertDialogHeader>

					<AlertDialogBody>
						<HStack>
							<Box className='flex-1'>
								<FormLabel>Starting Index</FormLabel>
								<Input
									variant='outline'
									placeholder='eg. 10000'
									value={page}
									onChange={(e) => setConfirm(e.target.value)}
								/>
							</Box>
							<Box className='flex-1'>
								<FormLabel>Total details</FormLabel>
								<Select value={limit} onChange={(e) => setTotal(e.target.value)}>
									<option className='text-black' value='10'>
										1,000
									</option>
									<option className='text-black' value='10000'>
										10,000
									</option>
									<option className='text-black' value='50000'>
										50,000
									</option>
									<option className='text-black' value='100000'>
										1,00,000
									</option>
									<option className='text-black' value='500000'>
										5,00,000
									</option>
									<option className='text-black' value='1000000'>
										10,00,000
									</option>
								</Select>
							</Box>
						</HStack>
					</AlertDialogBody>

					<AlertDialogFooter>
						<Button ref={cancelRef} onClick={onClose}>
							Cancel
						</Button>
						<Button
							colorScheme='green'
							onClick={handleExport}
							isDisabled={isNaN(Number(page))}
							ml={3}
						>
							Export
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogOverlay>
		</AlertDialog>
	);
});

export default BusinessLeadsDialog;
