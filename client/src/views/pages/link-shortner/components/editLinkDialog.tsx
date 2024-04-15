import React, { forwardRef, useImperativeHandle, useState } from 'react';

import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Box,
	Button,
	Input,
	Text,
	Textarea,
} from '@chakra-ui/react';
import { useTheme } from '../../../../hooks/useTheme';

export type EditLinkDialogHandle = {
	open: (link_details: { id: string; link: string; shortLink: string; title: string }) => void;
	close: () => void;
};

type Props = {
	onConfirm: (id: string, newLink: string, newTitle: string) => void;
};

const EditLinkDialog = forwardRef<EditLinkDialogHandle, Props>(({ onConfirm }: Props, ref) => {
	const theme = useTheme();
	const [isOpen, setOpen] = useState(false);

	const [link, setLink] = useState({
		type: 'LINK',
		id: '',
		link: '',
		shorten_link: '',
		title: '',
		number: '',
		message: '',
	} as {
		type: 'LINK' | 'NUMBER';
		id: string;
		link: string;
		shorten_link: string;
		title: string;
		number: string;
		message: string;
	});

	const close = () => {
		setOpen(false);
	};

	const cancelRef = React.useRef() as React.RefObject<HTMLButtonElement>;

	useImperativeHandle(ref, () => ({
		close: () => {
			setOpen(false);
		},
		open: (link_details: { id: string; link: string; shortLink: string; title: string }) => {
			setOpen(true);
			if (link_details.link.includes('wa.me')) {
				setLink({
					...link,
					id: link_details.id,
					type: 'NUMBER',
					number: link_details.link.split('wa.me/')[1].split('?')[0],
					message: decodeURIComponent(link_details.link.split('text=')[1]),
					title: link_details.title,
				});
			} else {
				setLink({
					...link,
					id: link_details.id,
					type: 'LINK',
					link: link_details.link,
					shorten_link: link_details.shortLink,
					title: link_details.title,
				});
			}
		},
	}));

	const handleEdit = () => {
		if (link.type === 'NUMBER') {
			onConfirm(
				link.id,
				`https://wa.me/${link.number}?text=${encodeURIComponent(link.message)}`,
				link.title
			);
		} else {
			onConfirm(link.id, link.link, link.title);
		}
	};

	return (
		<AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={close}>
			<AlertDialogOverlay>
				<AlertDialogContent
					backgroundColor={theme === 'dark' ? '#252525' : 'white'}
					textColor={theme === 'dark' ? 'white' : 'black'}
				>
					<AlertDialogHeader fontSize='lg' fontWeight='bold'>
						Edit Link
					</AlertDialogHeader>

					<AlertDialogBody>
						<Box pb={4}>
							<Text>Change Title</Text>
							<Input
								value={link.title}
								onChange={(e) =>
									setLink({
										...link,
										title: e.target.value,
									})
								}
								mt={2}
							/>
						</Box>
						{link.type === 'NUMBER' ? (
							<>
								<Box pb={4}>
									<Text>Change Number</Text>
									<Input
										value={link.number}
										onChange={(e) =>
											setLink({
												...link,
												number: e.target.value,
											})
										}
										mt={2}
									/>
								</Box>
								<Box pb={4}>
									<Text>Change Message</Text>
									<Textarea
										value={link.message.split('%20').join(' ').split('%0A').join('\n')}
										onChange={(e) =>
											setLink({
												...link,
												message: e.target.value,
											})
										}
										mt={2}
									/>
								</Box>
							</>
						) : (
							<>
								<Box pb={4}>
									<Text>Change Link</Text>
									<Input
										value={link.link}
										onChange={(e) =>
											setLink({
												...link,
												link: e.target.value,
											})
										}
										mt={2}
									/>
								</Box>
								<Box pb={4}>
									<Text>Shorten Link</Text>
									<Input value={link.shorten_link} isReadOnly mt={2} />
								</Box>
							</>
						)}
					</AlertDialogBody>

					<AlertDialogFooter>
						<Button ref={cancelRef} onClick={close}>
							Cancel
						</Button>
						<Button colorScheme='yellow' onClick={handleEdit} ml={3}>
							Save
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogOverlay>
		</AlertDialog>
	);
});

export default EditLinkDialog;
