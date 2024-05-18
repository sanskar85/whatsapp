import {
	Box,
	Flex,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Text,
	VStack,
	useDisclosure,
} from '@chakra-ui/react';
import Lottie from 'lottie-react';
import { forwardRef, useImperativeHandle } from 'react';
import { LOGO } from '../../assets/Images';
import { LOTTIE_AUTHENTICATED, LOTTIE_AUTHENTICATING } from '../../assets/Lottie';
import { Colors } from '../../config/const';
import QRLogo from './qr-image';

export type AddDeviceDialogHandle = {
	open: () => void;
	close: () => void;
};

type Status = 'UNINITIALIZED' | 'INITIALIZED' | 'AUTHENTICATED' | 'READY' | 'QR_GENERATED';

type Props = {
	status: Status;
	qr: string;
	onCompleted: () => void;
};

const AddDeviceDialog = forwardRef<AddDeviceDialogHandle, Props>(
	({ status, qr, onCompleted }: Props, ref) => {
		const { isOpen, onClose, onOpen } = useDisclosure();

		useImperativeHandle(ref, () => ({
			open: onOpen,
			close: onClose,
		}));

		return (
			<Modal isOpen={isOpen} onClose={onClose} isCentered>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader textAlign={'center'}>Add Device</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<Flex height={'350px'}>
							<Flex width={'100%'} m={'auto'} justifyContent={'center'}>
								{status === 'INITIALIZED' || status === 'AUTHENTICATED' ? (
									<Box width={'60%'}>
										<Lottie animationData={LOTTIE_AUTHENTICATING} loop={true} />
									</Box>
								) : status === 'QR_GENERATED' ? (
									<VStack width={'80%'} marginTop={'-1.75rem'}>
										<QRLogo base64Data={qr} logoUrl={LOGO} />
										<Text marginTop={'-1.75rem'} fontWeight={'medium'} color={'gray'}>
											Scan using your Whatsapp Camera
										</Text>
									</VStack>
								) : status === 'READY' ? (
									<Box width={'60%'}>
										<Lottie
											animationData={LOTTIE_AUTHENTICATED}
											color={Colors.ACCENT_DARK}
											onComplete={() => {
												onClose();
												onCompleted();
											}}
											loop={false}
										/>
									</Box>
								) : null}
							</Flex>
						</Flex>
					</ModalBody>
				</ModalContent>
			</Modal>
		);
	}
);

export default AddDeviceDialog;
