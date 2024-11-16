import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { HERO_BG, SCREEN_SHOT } from '../../../assets/Images';
import { THEME } from '../../../utils/const';
import PageWrapper from '../../components/pageWrapper';
import Details from './components/Details';
import Pricing from './components/Pricing';
import Question from './components/Question';
import Testimonial from './components/Testimonial';

const Home = () => {
	useEffect(() => {
		window.document.title = 'WhatsLeads';
		window.scroll(0, 0);
	}, []);
	return (
		<PageWrapper>
			<Box>
				<Flex
					width={'full'}
					justifyContent={'space-around'}
					backgroundImage={` linear-gradient(to right,rgba(255,255,255,1),rgba(255,255,255,1), rgba(255,255,255,0.7)), url('${HERO_BG}')`}
					alignItems={'center'}
					className='flex-col md:flex-row'
					px={'1rem'}
					height={'100vh'}
					id='home'
				>
					<Box>
						<Box pb={'2rem'}>
							<Text className='text-md text-center md:text-2xl md:text-left ' fontWeight={'medium'}>
								A Chrome extension for{' '}
								<Box as='span' color={THEME.THEME_GREEN}>
									Whatsapp
								</Box>{' '}
								that
							</Text>
							<Text className='text-md text-center md:text-2xl md:text-left ' fontWeight={'medium'}>
								enables you to effortlessly export
							</Text>
							<Text className='text-md text-center md:text-2xl md:text-left ' fontWeight={'medium'}>
								all your contacts with just
							</Text>
							<Text className='text-md text-center md:text-2xl md:text-left ' fontWeight={'medium'}>
								one click.
							</Text>
						</Box>
						<Flex direction={'column'}>
							<Flex alignItems={'center'} gap={'0.25rem'}>
								<Box
									height={'7px'}
									width={'7px'}
									rounded={'full'}
									backgroundColor={THEME.THEME_GREEN}
								/>
								<Text fontSize={'sm'}>Instantly export thousands of contacts</Text>
							</Flex>
							<Flex alignItems={'center'} gap={'0.25rem'}>
								<Box
									height={'7px'}
									width={'7px'}
									rounded={'full'}
									backgroundColor={THEME.THEME_GREEN}
								/>
								<Text fontSize={'sm'}>Export in CSV and VCF format</Text>
							</Flex>
							<Flex alignItems={'center'} gap={'0.25rem'}>
								<Box
									height={'7px'}
									width={'7px'}
									rounded={'full'}
									backgroundColor={THEME.THEME_GREEN}
								/>
								<Text fontSize={'sm'}>Pay once and download unlimited times for a month</Text>
							</Flex>
							<Flex alignItems={'center'} gap={'0.25rem'}>
								<Box
									height={'7px'}
									width={'7px'}
									rounded={'full'}
									backgroundColor={THEME.THEME_GREEN}
								/>
								<Text fontSize={'sm'}>Find unsaved Clients to Grow your Business</Text>
							</Flex>
							<Button
								size={'md'}
								backgroundColor={THEME.THEME_GREEN}
								color={'white'}
								rounded={'full'}
								className='my-4 mx-auto md:ml-0'
								onClick={() => {
									window.open('https://app.whatsleads.in/');
								}}
								_hover={{ backgroundColor: 'green.300' }}
							>
								<Text px={'0.5rem'}>Try Now</Text>
							</Button>
						</Flex>
					</Box>
					<Flex className='w-full md:w-1/2' justifyContent={'center'}>
						<Image
							className='w-2/3'
							maxWidth={'500px'}
							minWidth={'300px'}
							src={SCREEN_SHOT}
							alt=''
						/>
					</Flex>
				</Flex>
				<Details />
				<Testimonial />
				<Pricing />
				<Question />
			</Box>
		</PageWrapper>
	);
};
export default Home;
