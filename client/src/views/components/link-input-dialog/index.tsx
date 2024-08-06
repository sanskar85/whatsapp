import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalOverlay,
	Text,
	Textarea,
	useToast,
	VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import GroupService from '../../../services/group.service';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};
export default function LinkInputDialog({ isOpen, onClose }: Props) {
	const [linkInput, setLinkInput] = useState('');
	const [links, setLinks] = useState<string[]>([]);
	const [isChanged, setChanged] = useState(false);
	const toast = useToast();

	const handleTextChange = (text: string) => {
		if (text.length === 0) {
			setChanged(true);
			return setLinkInput('');
		}
		setLinkInput(text);
		setChanged(true);
	};

	const handleFormatClicked = () => {
		const lines = linkInput.split('\n');
		const res_links: string[] = [];
		for (const line of lines) {
			if (!line) continue;
			const regex = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{22}$/;
			if (regex.test(line)) {
				res_links.push(line);
				continue;
			}
		}
		setLinkInput(res_links.join('\n'));
		setLinks(res_links);
		setChanged(false);
	};

	const handleClose = async () => {
		if (links.length === 0) {
			toast({
				title: 'No links provided',
				description: 'Please provide at least one link',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		const success = await GroupService.generateInviteDetails(links);
		if (!success) {
			toast({
				title: 'Failed to export',
				description: 'Please try again',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		toast({
			title: 'Export in progress.',
			description: 'Check background tasks for further details',
			status: 'success',
			duration: 3000,
			isClosable: true,
		});

		onClose();
		setLinkInput('');
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size={'3xl'}>
			<ModalOverlay />
			<ModalContent>
				<ModalBody>
					<VStack>
						<Text alignSelf={'start'} pt={4}>
							Enter Whatsapp Invite Links
						</Text>

						<Textarea
							width={'full'}
							minHeight={'200px'}
							size={'sm'}
							rounded={'md'}
							placeholder={
								'Enter links (one per line) of the format https://chat.whatsapp.com/XXXXXXXXXXXXX'
							}
							// border={'none'}
							_placeholder={{
								opacity: 0.4,
								color: 'inherit',
							}}
							_focus={{ border: 'none', outline: 'none' }}
							value={linkInput}
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
								Format Links
							</Text>
						) : (
							<Text
								alignSelf={'center'}
								cursor={'pointer'}
								textDecoration={'underline'}
								textUnderlineOffset={'3px'}
							>
								{links.length} links provided.
							</Text>
						)}
						<Button
							colorScheme='green'
							variant='solid'
							width='full'
							onClick={handleClose}
							isDisabled={isChanged}
						>
							Generate Details
						</Button>
					</VStack>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
