import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalOverlay,
	Text,
	Textarea,
	VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (numbers: string[]) => void;
	numbers: string[];
};
export default function NumberInputDialog({
	isOpen,
	onClose,
	onConfirm,
	numbers: prefilledNumbers,
}: Props) {
	const [numberInput, setNumberInput] = useState('');
	const [numbers, setNumbers] = useState<string[]>(prefilledNumbers || []);
	const [isChanged, setChanged] = useState(false);

	const handleTextChange = (text: string) => {
		if (text.length === 0) {
			setChanged(true);
			return setNumberInput('');
		}
		setNumberInput(text);
		setChanged(true);
	};

	const handleFormatClicked = () => {
		const lines = numberInput.split('\n');
		const res_lines = [];
		const res_numbers: string[] = [];
		for (const line of lines) {
			if (!line) continue;
			const _numbers = line
				.split(/[ ,]+/)
				.map((number) => number.trim())
				.filter((number) => number && !isNaN(Number(number)));
			res_numbers.push(..._numbers);
			res_lines.push(_numbers.join(', '));
		}

		setNumberInput(res_lines.join('\n'));
		setNumbers(res_numbers);
		setChanged(false);
	};

	const handleClose = () => {
		onConfirm(numbers);
		onClose();
		setNumberInput('');
	};

	useEffect(() => {
		console.log(prefilledNumbers);
		if (!prefilledNumbers) return;
		setNumberInput(prefilledNumbers.join(', '));
	}, [prefilledNumbers]);

	return (
		<Modal isOpen={isOpen} onClose={onClose} size={'3xl'}>
			<ModalOverlay />
			<ModalContent>
				<ModalBody>
					<VStack>
						<Text alignSelf={'start'} pt={4}>
							Enter Recipients Number
						</Text>

						<Textarea
							width={'full'}
							minHeight={'200px'}
							size={'sm'}
							rounded={'md'}
							placeholder={
								'Enter recipients numbers separated by commas\nE.g. 91xxxxxxxxx8, 91xxxxxxxxx8'
							}
							// border={'none'}
							_placeholder={{
								opacity: 0.4,
								color: 'inherit',
							}}
							_focus={{ border: 'none', outline: 'none' }}
							value={numberInput}
							onChange={(e) => handleTextChange(e.target.value)}
							resize={'vertical'}
						/>
					</VStack>
				</ModalBody>

				<ModalFooter>
					<VStack width={'full'}>
						{isChanged ? (
							<Text
								alignSelf={'center'}
								cursor={'pointer'}
								textDecoration={'underline'}
								textUnderlineOffset={'3px'}
								onClick={handleFormatClicked}
							>
								Format Numbers
							</Text>
						) : (
							<Text
								alignSelf={'center'}
								cursor={'pointer'}
								textDecoration={'underline'}
								textUnderlineOffset={'3px'}
							>
								{numbers.length} numbers provided.
							</Text>
						)}
						<Button
							colorScheme='green'
							variant='solid'
							width='full'
							onClick={handleClose}
							isDisabled={isChanged}
						>
							Done
						</Button>
					</VStack>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
