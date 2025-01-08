import {
	Button,
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerOverlay,
	Flex,
	Image,
	Text,
	useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { LOGO, MENU } from '../../../assets/Images';
import { ROUTES, THEME } from '../../../utils/const';

export default function Navbar() {
	const navigate = useNavigate();

	const scrollTo = (id: string) => {
		navigate(ROUTES.HOME);
		const element = document.getElementById(id);
		element?.scrollIntoView({ behavior: 'smooth' });
	};
	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<Flex
			bg='#4CB072'
			py={'0.5rem'}
			px={'1rem'}
			justifyContent={'space-between'}
			alignItems={'center'}
			position={'fixed'}
			top={0}
			width={'100%'}
			zIndex={1000}
		>
			<Flex alignItems={'center'}>
				<Button
					variant={'unstyled'}
					display={'flex'}
					alignItems={'center'}
					onClick={() => scrollTo('home')}
				>
					<Image src={LOGO} alt='Logo' height={'35px'} />
					<Text color={'white'} fontSize={'lg'} fontWeight={'bold'} ml={'1rem'}>
						WhatsLeads
					</Text>
				</Button>
			</Flex>
			<Flex className='!hidden md:!flex' gap={'2rem'} alignItems={'center '}>
				<Button
					color={'white'}
					variant={'link'}
					outline={'none'}
					border={'none'}
					_hover={{ textColor: 'green.300' }}
					onClick={() => scrollTo('home')}
				>
					Home
				</Button>
				<Button
					color={'white'}
					variant={'link'}
					outline={'none'}
					border={'none'}
					_hover={{ textColor: 'green.300' }}
					onClick={() => scrollTo('features')}
				>
					Features
				</Button>
				<Button
					color={'white'}
					variant={'link'}
					outline={'none'}
					border={'none'}
					_hover={{ textColor: 'green.300' }}
					onClick={() => navigate(ROUTES.PRICING)}
				>
					Pricing
				</Button>
				<Button
					color={'white'}
					variant={'link'}
					outline={'none'}
					border={'none'}
					_hover={{ textColor: 'green.300' }}
					onClick={() => scrollTo('faq')}
				>
					FAQs
				</Button>
				<Button
					color={'white'}
					variant={'link'}
					outline={'none'}
					border={'none'}
					_hover={{ textColor: 'green.300' }}
					onClick={() => navigate(ROUTES.FEATURES)}
				>
					URL Shortner
				</Button>
				<Button
					color={'white'}
					variant={'link'}
					outline={'none'}
					border={'none'}
					_hover={{ textColor: 'green.300' }}
					onClick={() => navigate(ROUTES.API)}
				>
					API Docs
				</Button>

				<Button
					variant={'solid'}
					backgroundColor={'white'}
					rounded={'full'}
					outline={'none'}
					gap={'0.5rem'}
					onClick={() => {
						window.open('https://app.whatsleads.in');
					}}
				>
					<Text textColor={'#4CB072'}>Try Now</Text>
				</Button>
			</Flex>
			<Button
				backgroundColor={'#4CB072'}
				_hover={{ backgroundColor: '#4CB072' }}
				variant={'link'}
				outline={'none'}
				border={'none'}
				className='!flex md:!hidden'
				onClick={onOpen}
			>
				<Image src={MENU} alt='Menu' />
			</Button>
			<Drawer isOpen={isOpen} placement='right' onClose={onClose} size={'full'}>
				<DrawerOverlay />
				<DrawerContent>
					<DrawerCloseButton />

					<DrawerBody backgroundColor={'#4CB072'}>
						<Flex direction={'column'} pt={'2rem'} alignItems={'center'} gap={'1.25rem'}>
							<Button
								textAlign={'left'}
								variant={'link'}
								_hover={{ textColor: 'green.300' }}
								textColor={'white'}
								transition={'0.1s'}
								cursor={'pointer'}
								onClick={() => {
									scrollTo('home');
									onClose();
								}}
							>
								Home
							</Button>
							<Button
								textAlign={'left'}
								variant={'link'}
								_hover={{ textColor: 'green.300' }}
								textColor={'white'}
								transition={'0.1s'}
								cursor={'pointer'}
								onClick={() => {
									scrollTo('features');
									onClose();
								}}
							>
								Features
							</Button>
							<Button
								textAlign={'left'}
								alignItems={'flex-start'}
								variant={'link'}
								_hover={{ textColor: 'green.300' }}
								textColor={'white'}
								transition={'0.1s'}
								cursor={'pointer'}
								onClick={() => {
									navigate(ROUTES.PRICING);
									onClose();
								}}
							>
								Pricing
							</Button>
							<Button
								textAlign={'left'}
								alignItems={'flex-start'}
								variant={'link'}
								_hover={{ textColor: 'green.300' }}
								textColor={'white'}
								transition={'0.1s'}
								cursor={'pointer'}
								onClick={() => {
									scrollTo('faq');
									onClose();
								}}
							>
								FAQs
							</Button>
							<Button
								color={'white'}
								variant={'link'}
								outline={'none'}
								border={'none'}
								_hover={{ textColor: 'green.300' }}
								onClick={() => navigate(ROUTES.FEATURES)}
							>
								URL Shortner
							</Button>
							<Button
								color={'white'}
								variant={'link'}
								outline={'none'}
								border={'none'}
								_hover={{ textColor: 'green.300' }}
								onClick={() => navigate(ROUTES.API)}
							>
								API Docs
							</Button>
							<Button
								variant={'link'}
								backgroundColor={'white'}
								_hover={{ textColor: 'green.300' }}
								textColor={THEME.THEME_GREEN}
								rounded={'full'}
								size={'md'}
								transition={'0.1s'}
								cursor={'pointer'}
								onClick={() => {
									window.open('https://app.whatsleads.in');
									onClose();
								}}
								px={'0.5rem'}
								py={'0.25rem'}
							>
								<Text mx={'0.5rem'}>Try Now</Text>
							</Button>
						</Flex>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</Flex>
	);
}
