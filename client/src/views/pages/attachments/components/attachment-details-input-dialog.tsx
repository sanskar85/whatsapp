import { CheckIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Flex,
	FormControl,
	FormLabel,
	HStack,
	IconButton,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Select,
	Text,
	Textarea,
	useToast,
} from '@chakra-ui/react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Dropzone from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import AttachmentService from '../../../../services/attachment.service';
import { StoreNames, StoreState } from '../../../../store';
import {
	addAttachment,
	clearSelectedAttachment,
	setCaption,
	setCustomCaption,
	setError,
	setFile,
	setName,
	startAttachmentSaving,
	updateAttachment,
} from '../../../../store/reducers/AttachmentReducers';
import ProgressBar, { ProgressBarHandle } from '../../../components/progress-bar';
import Variables from '../../../components/variables';

export type AttachmentDetailsInputDialogHandle = {
	close: () => void;
	open: () => void;
};

const AttachmentDetailsInputDialog = forwardRef<AttachmentDetailsInputDialogHandle>((_, ref) => {
	const dispatch = useDispatch();
	const toast = useToast();
	const progressRef = useRef<ProgressBarHandle>(null);
	const captionRef = useRef<HTMLTextAreaElement>(null);
	const [isOpen, setOpen] = useState(false);

	const { selectedAttachment, file, uiDetails } = useSelector(
		(state: StoreState) => state[StoreNames.ATTACHMENT]
	);

	const { list } = useSelector((state: StoreState) => state[StoreNames.CSV]);

	const { caption, custom_caption, name } = selectedAttachment;

	const { errorMessage, isSaving, isUpdating } = uiDetails;

	const [selectedCSV, setSelectedCSV] = useState<{
		id: string;
		name: string;
		headers: string[];
	}>();

	const onClose = () => {
		dispatch(clearSelectedAttachment());
		setOpen(false);
	};

	useImperativeHandle(ref, () => ({
		close: () => {
			setSelectedCSV({
				id: '',
				name: '',
				headers: [],
			});
			dispatch(clearSelectedAttachment());
			setOpen(false);
		},
		open: () => {
			setOpen(true);
		},
	}));

	const handleSelectCSV = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedCSV({
			id: '',
			name: '',
			headers: [],
		});
		const csv = list.find((item) => item.fileName === e.target.value);
		if (csv) {
			setSelectedCSV(csv);
		}
	};

	const setVariables = (header: string) => {
		dispatch(
			setCaption(
				caption.substring(0, captionRef.current?.selectionStart) +
					header +
					caption.substring(captionRef.current?.selectionEnd ?? 0, caption.length)
			)
		);
	};

	const handleAttachmentInput = (files: File) => {
		if (files === null) return;
		if (files.size > 62914560) {
			toast({
				title: 'Warning',
				description: 'File size should be less than 60MB',
				status: 'warning',
			});
			return dispatch(setError('File size should be less than 60MB'));
		}
		dispatch(setFile(files));
	};

	const onUploadProgress = (progressEvent: number) => {
		progressRef.current?.setProgressValue(progressEvent);
	};

	const handleAddAttachment = async () => {
		if (!name) {
			dispatch(setError('Please enter a file name'));
			return;
		}

		if (isUpdating) {
			dispatch(startAttachmentSaving());
			if (file) {
				AttachmentService.updateAttachmentFile(selectedAttachment.id, file).then((res) => {
					if (!res) {
						toast({
							title: 'Error',
							description: 'Error while updating attachment',
							status: 'error',
							duration: 5000,
							isClosable: true,
						});
						return;
					}
					setOpen(false);
					toast({
						title: 'Updated',
						description: 'Attachment updated successfully',
						status: 'success',
						duration: 5000,
						isClosable: true,
					});
				});
			}
			AttachmentService.updateAttachmentDetails(selectedAttachment).then((res) => {
				if (!res) {
					toast({
						title: 'Error',
						description: 'Error while updating attachment',
						status: 'error',
						duration: 5000,
						isClosable: true,
					});
					return;
				}
				dispatch(updateAttachment(res));
				setOpen(false);
				toast({
					title: 'Updated',
					description: 'Attachment updated successfully',
					status: 'success',
					duration: 5000,
					isClosable: true,
				});
			});
		} else {
			if (!file) {
				dispatch(setError('Please select a file'));
				return;
			}
			dispatch(startAttachmentSaving());
			AttachmentService.uploadAttachment(
				file,
				name,
				caption,
				custom_caption,
				onUploadProgress
			).then((res) => {
				if (!res) {
					toast({
						title: 'Error',
						description: 'Error while uploading attachment',
						status: 'error',
						duration: 5000,
						isClosable: true,
					});
					return;
				}
				dispatch(addAttachment(res.data.attachment));
				setOpen(false);
				toast({
					title: 'Uploaded',
					description: 'Attachment uploaded successfully',
					status: 'success',
					duration: 5000,
					isClosable: true,
				});
			});
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size={'2xl'}
			closeOnOverlayClick={!isSaving}
			scrollBehavior='inside'
		>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Add Attachment</ModalHeader>
				<ModalBody pb={6}>
					<Dropzone
						onDropAccepted={(acceptedFile) => {
							handleAttachmentInput(acceptedFile[0]);
						}}
						maxSize={62914560}
						onDropRejected={() => dispatch(setError('File size should be less than 60MB'))}
						multiple={false}
						onError={(err) => {
							dispatch(setError(err.message));
						}}
					>
						{({ getRootProps, getInputProps }) => (
							<Box
								{...getRootProps()}
								borderWidth={'1px'}
								borderColor={'gray'}
								borderStyle={'dashed'}
								borderRadius={'lg'}
								py={'3rem'}
								textAlign={'center'}
								textColor={'gray'}
							>
								<input {...getInputProps()} />
								<Text>Drag and drop file here, or click to select files</Text>
							</Box>
						)}
					</Dropzone>
					{file && <Text mt={'0.5rem'}>Selected file : {file.name}</Text>}
					<FormControl isInvalid={!!errorMessage} pt={'1rem'}>
						<FormLabel>File name</FormLabel>
						<Input
							placeholder='file name'
							value={name ?? ''}
							onChange={(e) => dispatch(setName(e.target.value))}
						/>
					</FormControl>

					<FormControl mt={4}>
						<HStack alignItems={'center'} justifyContent={'space-between'} pb={'0.5rem'}>
							<FormLabel>Caption</FormLabel>
							<Flex gap={2} alignItems={'center'}>
								<IconButton
									isRound={true}
									variant='solid'
									aria-label='Done'
									size='xs'
									icon={custom_caption ? <CheckIcon color='white' /> : <></>}
									onClick={() => {
										dispatch(setCustomCaption(!custom_caption));
									}}
									colorScheme={custom_caption ? 'green' : 'gray'}
								/>
								<Text className='text-black ' fontSize='sm'>
									Custom Caption
								</Text>
							</Flex>
						</HStack>
						<Textarea
							ref={captionRef}
							placeholder={`Enter caption here\r\nAdd variable like {{variable name}}`}
							value={caption ?? ''}
							onChange={(e) => dispatch(setCaption(e.target.value))}
						/>
					</FormControl>
					{custom_caption && (
						<>
							<FormControl pt={'1rem'}>
								<FormLabel>Select CSV for Headers</FormLabel>
								<HStack>
									<Select value={selectedCSV?.id} onChange={handleSelectCSV}>
										<option>Select CSV</option>
										{list.map((item, index) => {
											return (
												<option value={item.fileName} key={index}>
													{item.name}
												</option>
											);
										})}
									</Select>
								</HStack>
							</FormControl>
							<Variables
								data={selectedCSV?.headers ?? []}
								onVariableSelect={setVariables}
								marginTop={'1rem'}
							/>
						</>
					)}
				</ModalBody>

				<ModalFooter>
					<HStack width={'full'} justifyContent={'flex-end'}>
						<ProgressBar ref={progressRef} />
						<Button onClick={onClose} colorScheme='red' isDisabled={isSaving}>
							Cancel
						</Button>
						<Button
							colorScheme='whatsapp'
							mr={3}
							onClick={handleAddAttachment}
							isLoading={isSaving}
						>
							Save
						</Button>
					</HStack>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
});

export default AttachmentDetailsInputDialog;
