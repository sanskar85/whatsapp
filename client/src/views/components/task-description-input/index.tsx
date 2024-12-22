import {
	Box,
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
} from '@chakra-ui/react';
import { forwardRef, useImperativeHandle, useState } from 'react';

export type TaskInputHandle = {
	open: (vcf_only: boolean) => void;
};

type TaskInputProps = {
	onConfirm: (vcf_only: boolean, task_description: string) => void;
};

export const TaskInput = forwardRef<TaskInputHandle, TaskInputProps>(
	({ onConfirm }: TaskInputProps, ref) => {
		const [isOpen, setIsOpen] = useState(false);
		const [task_description, setTaskDescription] = useState('');
		const [vcf_only, setVcfOnly] = useState(false);

		const onClose = () => setIsOpen(false);

		useImperativeHandle(ref, () => ({
			open: (vcf_only: boolean) => {
				setIsOpen(true);
				setVcfOnly(vcf_only);
			},
		}));

		return (
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Task Description</ModalHeader>
					<ModalBody>
						<Box>Enter task description (optional)</Box>
						<Input
							value={task_description}
							onChange={(e) => setTaskDescription(e.target.value)}
							placeholder='Task Description'
						/>
					</ModalBody>
					<ModalFooter>
						<Button colorScheme='blue' mr={3} onClick={onClose}>
							Close
						</Button>
						<Button colorScheme='green' onClick={() => onConfirm(vcf_only, task_description)}>
							Save
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}
);
