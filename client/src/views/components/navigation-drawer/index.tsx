import { SettingsIcon } from '@chakra-ui/icons';
import { Box, Flex, Icon, IconButton, Image, Text, VStack } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { BiCalendarMinus, BiCode, BiPoll } from 'react-icons/bi';
import { FiBarChart2, FiLink2 } from 'react-icons/fi';
import { GrTasks } from 'react-icons/gr';
import { MdGroups3, MdOutlineAttachment, MdOutlineContactPhone } from 'react-icons/md';
import { SiProbot } from 'react-icons/si';
import { TbCsv, TbLogout2, TbMessage2Minus } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LOGO } from '../../../assets/Images';
import { NAVIGATION } from '../../../config/const';
import { toggleTheme, useTheme } from '../../../hooks/useTheme';
import UserService from '../../../services/user.service';
import { StoreNames, StoreState } from '../../../store';
import { setSettingsOpen } from '../../../store/reducers/UserDetailsReducers';
import Settings from '../../pages/settings';

function isActiveTab(tab: string, path: string): boolean {
	if (path.includes(tab)) return true;
	return false;
}

export default function NavigationDrawer() {
	const theme = useTheme();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const { settingsOpen } = useSelector((state: StoreState) => state[StoreNames.USER]);

	const onOpen = () => {
		dispatch(setSettingsOpen(true));
	};

	const onClose = () => {
		dispatch(setSettingsOpen(false));
	};

	const handleLogout = async () => {
		await UserService.logout();
		navigate(NAVIGATION.WELCOME);
	};

	return (
		<Box>
			<Flex
				direction={'column'}
				// alignItems={'center'}
				width={'70px'}
				_hover={{
					width: '200px',
				}}
				userSelect={'none'}
				position={'fixed'}
				minHeight={'100vh'}
				borderRightWidth={'thin'}
				borderRightColor={theme === 'light' ? 'gray.300' : 'gray.500'}
				paddingY={'0.75rem'}
				zIndex={99}
				background={theme === 'light' ? 'white' : '#252525'}
			>
				<Box
					borderBottomWidth={'thin'}
					borderBottomColor={theme === 'light' ? 'gray.300' : 'gray.500'}
					paddingBottom={'0.75rem'}
					width={'100%'}
					height={'50px'}
					paddingLeft={'15px'}
				>
					<Image src={LOGO} width={'36px'} className='shadow-lg rounded-full' />
				</Box>
				<Flex
					direction={'column'}
					height={'calc(100vh - 50px)'}
					overflowY={'auto'}
					paddingBottom={'1rem'}
					flexGrow={1}
				>
					<Box flexGrow={'1'}>
						<Flex flexDirection={'column'} paddingY={'0.5rem'} paddingX={'0.5rem'} gap={'0.25rem'}>
							<MenuButton icon={MdOutlineContactPhone} route={NAVIGATION.CONTACT} name='Contacts' />

							<MenuButton icon={TbMessage2Minus} route={NAVIGATION.SCHEDULER} name='Messages' />
							<MenuButton
								icon={BiCalendarMinus}
								route={NAVIGATION.SCHEDULER_BY_DATE}
								name='Scheduler'
							/>
							<MenuButton icon={SiProbot} route={NAVIGATION.BOT} name='Bot' />
							<MenuButton
								icon={MdOutlineAttachment}
								route={NAVIGATION.ATTACHMENTS}
								name='Attachments'
							/>
							<MenuButton icon={FiLink2} route={NAVIGATION.SHORT} name='Links' />
							<MenuButton icon={BiPoll} route={NAVIGATION.POLL_RESPONSES} name='Poll' />
							<MenuButton icon={FiBarChart2} route={NAVIGATION.REPORTS} name='Reports' />
							<MenuButton icon={TbCsv} route={NAVIGATION.CSV} name='CSV ' />
							<MenuButton icon={MdGroups3} route={NAVIGATION.GROUP_MERGE} name='Groups' />
							<MenuButton icon={GrTasks} route={NAVIGATION.TASKS} name='Tasks' />
							<MenuButton icon={BiCode} route={NAVIGATION.API} name='API Keys' />
						</Flex>
					</Box>
					<VStack alignItems={'flex-start'} pl={4}>
						<IconButton
							aria-label='Settings'
							icon={<SettingsIcon color={theme === 'light' ? 'black' : 'white'} />}
							onClick={onOpen}
							className='focus:outline-none focus:border-none'
							backgroundColor={'transparent'}
							_hover={{
								backgroundColor: 'transparent',
								border: 'none',
								outline: 'none',
							}}
						/>
						<IconButton
							aria-label='Change Theme'
							icon={theme === 'light' ? <DarkIcon /> : <LightIcon />}
							onClick={toggleTheme}
							className='focus:outline-none focus:border-none'
							backgroundColor={'transparent'}
							_hover={{
								backgroundColor: 'transparent',
								border: 'none',
								outline: 'none',
							}}
						/>
						<IconButton
							aria-label='Logout'
							color={theme === 'light' ? 'black' : 'white'}
							icon={<TbLogout2 />}
							onClick={handleLogout}
							className='focus:outline-none focus:border-none rotate-180'
							backgroundColor={'transparent'}
							_hover={{
								backgroundColor: 'transparent',
								border: 'none',
								outline: 'none',
							}}
						/>
					</VStack>
				</Flex>
			</Flex>
			<Settings isOpen={settingsOpen} onClose={onClose} />
		</Box>
	);
}

type MenuButtonProps = {
	route: string;
	icon: IconType;
	name: string;
};

function MenuButton({ route, icon, name }: MenuButtonProps) {
	const navigate = useNavigate();
	return (
		<Flex
			className={`cursor-pointer overflow-hidden whitespace-nowrap
							hover:!shadow-xl  hover:!drop-shadow-lg hover:!bg-green-100 hover:!font-medium 
							${
								isActiveTab(route, location.pathname) &&
								'shadow-xl  drop-shadow-lg bg-green-200 group-hover:shadow-none group-hover:drop-shadow-none group-hover:bg-transparent text-green-900 font-bold'
							}`}
			padding={'1rem'}
			rounded={'lg'}
			gap={'1.1rem'}
			onClick={() => navigate(route)}
		>
			<Icon as={icon} color={'green.400'} width={5} height={5} />
			<Text transition={'none'} className=' text-green-700'>
				{name}
			</Text>
		</Flex>
	);
}

function DarkIcon() {
	return (
		<svg
			height='20'
			width='20'
			fill='currentColor'
			viewBox='0 0 24 24'
			xmlns='http://www.w3.org/2000/svg'
		>
			<path
				clipRule='evenodd'
				d='M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z'
				fillRule='evenodd'
			></path>
		</svg>
	);
}

function LightIcon() {
	return (
		<svg height='20' width='20' fill='white' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
			<path d='M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z'></path>
		</svg>
	);
}
