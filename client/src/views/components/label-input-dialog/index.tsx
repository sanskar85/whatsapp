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
	onConfirm: (labels: string[]) => void;
	labels: string[];
};
export default function LabelInputDialog({
	isOpen,
	onClose,
	onConfirm,
	labels: prefilledLabels,
}: Props) {
	const [labelInput, setLabelInput] = useState('');
	const [labels, setLabels] = useState<string[]>(prefilledLabels || []);
	const [isChanged, setChanged] = useState(false);

	const handleTextChange = (text: string) => {
		if (text.length === 0) {
			setChanged(true);
			return setLabelInput('');
		}
		setLabelInput(text);
		setChanged(true);
	};

	const handleFormatClicked = () => {
		const lines = labelInput.split('\n');
		const res_lines = [];
		const res_labels: string[] = [];
		for (const line of lines) {
			if (!line) continue;
			const _labels = line.split(/[ ,]+/).map((label) => label.trim());
			res_labels.push(..._labels);
			res_lines.push(_labels.join(', '));
		}

		setLabelInput(res_lines.join('\n'));
		setLabels(res_labels);
		setChanged(false);
	};

	const handleClose = () => {
		onConfirm(labels);
		onClose();
		setLabelInput('');
	};

	useEffect(() => {
		if (!prefilledLabels) return;
		setLabelInput(prefilledLabels.join(', '));
	}, [prefilledLabels]);

	return (
		<Modal isOpen={isOpen} onClose={onClose} size={'3xl'}>
			<ModalOverlay />
			<ModalContent>
				<ModalBody>
					<VStack>
						<Text alignSelf={'start'} pt={4}>
							Enter Label Ids
						</Text>

						<Textarea
							width={'full'}
							minHeight={'200px'}
							size={'sm'}
							rounded={'md'}
							placeholder={
								'Enter label ids separated by commas\nE.g. label1, label2'
							}
							// border={'none'}
							_placeholder={{
								opacity: 0.4,
								color: 'inherit',
							}}
							_focus={{ border: 'none', outline: 'none' }}
							value={labelInput}
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
								Format Labels
							</Text>
						) : (
							<Text
								alignSelf={'center'}
								cursor={'pointer'}
								textDecoration={'underline'}
								textUnderlineOffset={'3px'}
							>
								{labels.length} labels provided.
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
