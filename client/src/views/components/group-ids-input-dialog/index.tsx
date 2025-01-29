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
	ids: string[];
};
export default function GroupIdsInputDialog({
	isOpen,
	onClose,
	onConfirm,
	ids: prefilledIds,
}: Props) {
	const [idInput, setIDInput] = useState('');
	const [ids, setIds] = useState<string[]>(prefilledIds || []);
	const [isChanged, setChanged] = useState(false);

	useEffect(() => {
		setChanged(true);
	}, [prefilledIds, setChanged]);

	const handleTextChange = (text: string) => {
		if (text.length === 0) {
			setChanged(true);
			return setIDInput('');
		}
		setIDInput(text);
		setChanged(true);
	};

	const handleFormatClicked = () => {
		const lines = idInput.split('\n');
		const res_lines = [];
		const res_ids: string[] = [];
		for (const line of lines) {
			if (!line) continue;
			const _ids = line
				.split(/[ ,]+/)
				.map((id) => id.trim())
				.filter((id) => id.endsWith('@g.us'));
			res_ids.push(..._ids);
			res_lines.push(_ids.join(', '));
		}

		setIDInput(res_lines.join('\n'));
		setIds(res_ids);
		setChanged(false);
	};

	const handleClose = () => {
		onConfirm(ids);
		onClose();
		setIDInput('');
	};

	useEffect(() => {
		if (!prefilledIds) return;
		setIDInput(prefilledIds.join(', '));
	}, [prefilledIds]);

	return (
		<Modal isOpen={isOpen} onClose={onClose} size={'3xl'}>
			<ModalOverlay />
			<ModalContent>
				<ModalBody>
					<VStack>
						<Text alignSelf={'start'} pt={4}>
							Enter Group IDs
						</Text>

						<Textarea
							width={'full'}
							minHeight={'200px'}
							size={'sm'}
							rounded={'md'}
							placeholder={
								'Enter Group IDs separated by commas\nE.g. 20xxxxxxxxx8@g.us, 31xxxxxxxxx8@g.us'
							}
							// border={'none'}
							_placeholder={{
								opacity: 0.4,
								color: 'inherit',
							}}
							_focus={{ border: 'none', outline: 'none' }}
							value={idInput}
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
								Format Group IDs
							</Text>
						) : (
							<Text
								alignSelf={'center'}
								cursor={'pointer'}
								textDecoration={'underline'}
								textUnderlineOffset={'3px'}
							>
								{ids.length} groups provided.
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
