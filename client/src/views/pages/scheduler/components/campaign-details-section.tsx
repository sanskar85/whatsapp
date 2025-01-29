import {
	Box,
	Button,
	Flex,
	FormControl,
	FormLabel,
	Input,
	Select,
	Text,
	Textarea,
	VStack,
	useDisclosure,
} from '@chakra-ui/react';
import Multiselect from 'multiselect-react-dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../../../hooks/useTheme';
import { StoreNames, StoreState } from '../../../../store';
import {
	setCSVFile,
	setCampaignName,
	setCampaignNameError,
	setDescription,
	setGroupRecipients,
	setLabelRecipients,
	setRecipientsError,
	setRecipientsFrom,
	setVariables,
} from '../../../../store/reducers/SchedulerReducer';
import GroupIdsInputDialog from '../../../components/group-ids-input-dialog';
import NumberInputDialog from './numbers-input-dialog';

export default function CampaignDetailsSection({
	fetchRecipients,
}: {
	fetchRecipients: (text: string) => void;
}) {
	const theme = useTheme();

	const {
		details,
		ui: { campaignNameError },
	} = useSelector((state: StoreState) => state[StoreNames.SCHEDULER]);
	const dispatch = useDispatch();

	return (
		<VStack flex={1}>
			<Flex gap={'2rem'} width={'full'}>
				<FormControl isInvalid={campaignNameError} flex={1}>
					<FormLabel color={theme === 'dark' ? 'white' : 'zinc.500'}>Campaign Name</FormLabel>
					<Input
						color={theme === 'dark' ? 'white' : 'gray.800'}
						type='text'
						value={details.campaign_name}
						onChange={(e) => {
							dispatch(setCampaignNameError(false));
							dispatch(setCampaignName(e.target.value));
						}}
					/>
				</FormControl>
				<Flex flex={1} gap={'1rem'}>
					<RecipientFromSelector fetchRecipients={fetchRecipients} />
					<RecipientToSelector />
				</Flex>
			</Flex>
			<FormControl>
				<FormLabel color={theme === 'dark' ? 'white' : 'GrayText'}>Description</FormLabel>
				<Textarea
					width={'full'}
					minHeight={'80px'}
					size={'sm'}
					rounded={'md'}
					placeholder={'Description for campaign'}
					border={'none'}
					className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
					_placeholder={{
						opacity: 0.4,
						color: 'inherit',
					}}
					_focus={{ border: 'none', outline: 'none' }}
					value={details.description ?? ''}
					onChange={(e) => dispatch(setDescription(e.target.value))}
				/>
			</FormControl>
		</VStack>
	);
}

function RecipientFromSelector({ fetchRecipients }: { fetchRecipients: (text: string) => void }) {
	const theme = useTheme();
	const dispatch = useDispatch();

	const { details } = useSelector((state: StoreState) => state[StoreNames.SCHEDULER]);

	const { userType } = useSelector((state: StoreState) => state[StoreNames.USER]);

	return (
		<FormControl width={'10rem'}>
			<FormLabel color={theme === 'dark' ? 'white' : 'GrayText'}>Recipients From</FormLabel>
			<Select
				className={`!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full ${
					details.type ? ' text-black dark:text-white' : ' text-gray-700 dark:text-gray-400'
				}`}
				border={'none'}
				value={details.type}
				onChange={(e) => {
					dispatch(
						setRecipientsFrom(
							e.target.value as
								| 'NUMBERS'
								| 'CSV'
								| 'GROUP'
								| 'SAVED'
								| 'UNSAVED'
								| 'LABEL'
								| 'GROUP_INDIVIDUAL'
								| 'GROUP_INDIVIDUAL_WITHOUT_ADMINS'
						)
					);
					dispatch(setGroupRecipients([]));
					dispatch(setLabelRecipients([]));
					fetchRecipients(e.target.value);
				}}
			>
				<option
					className="'text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] "
					value='NUMBERS'
				>
					Numbers
				</option>
				<option
					className="'text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] "
					value='CSV'
				>
					CSV
				</option>
				<option
					className="'text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] "
					value='SAVED'
				>
					Saved Contacts
				</option>
				<option
					className="'text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] "
					value='UNSAVED'
				>
					Unsaved Contacts
				</option>
				<option
					className="'text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] "
					value='GROUP'
				>
					Groups
				</option>
				<option
					className="'text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] "
					value='GROUP_INDIVIDUAL'
				>
					Group Individuals
				</option>
				<option
					className="'text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] "
					value='GROUP_INDIVIDUAL_WITHOUT_ADMINS'
				>
					Group Individuals Without Admins
				</option>
				{userType === 'BUSINESS' ? (
					<option
						className="'text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] "
						value='LABEL'
					>
						Labels
					</option>
				) : null}
			</Select>
		</FormControl>
	);
}

function RecipientToSelector() {
	const theme = useTheme();

	const {
		isOpen: isNumberInputOpen,
		onOpen: openNumberInput,
		onClose: closeNumberInput,
	} = useDisclosure();

	const {
		isOpen: isGroupInputOpen,
		onOpen: openGroupInput,
		onClose: closeGroupInput,
	} = useDisclosure();

	const {
		details,
		recipients,
		isRecipientsLoading,
		ui: { recipientsError },
	} = useSelector((state: StoreState) => state[StoreNames.SCHEDULER]);
	const dispatch = useDispatch();

	const setSelectedRecipients = (ids: string[]) => {
		if (['GROUP', 'GROUP_INDIVIDUAL', 'GROUP_INDIVIDUAL_WITHOUT_ADMINS'].includes(details.type)) {
			dispatch(setGroupRecipients(ids));
		} else if (details.type === 'LABEL') {
			dispatch(setLabelRecipients(ids));
		}
	};

	if (['SAVED', 'UNSAVED'].includes(details.type)) {
		return null;
	}

	return (
		<FormControl
			alignItems='flex-end'
			justifyContent={'space-between'}
			width={'full'}
			flex={1}
			isInvalid={recipientsError}
		>
			<FormLabel color={theme === 'dark' ? 'white' : 'GrayText'}>
				{details.type === 'NUMBERS' ? 'Selected Numbers' : 'Choose Existing Database'}
			</FormLabel>
			{details.type === 'CSV' ? (
				<Flex direction={'column'} gap={2}>
					<Select
						className='!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full text-black dark:text-white '
						border={'none'}
						value={details.csv_file}
						onChange={(e) => {
							dispatch(setRecipientsError(false));
							dispatch(setCSVFile(e.target.value));
							const recipient = recipients.find((recipient) => recipient.id === e.target.value);
							if (!recipient || !recipient.headers) return;
							if (recipient) dispatch(setVariables(recipient.headers));
						}}
					>
						<option
							value={'select'}
							className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
						>
							Select one!
						</option>
						{recipients.map(({ id, name }) => (
							<option
								className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
								value={id}
								key={id}
							>
								{name}
							</option>
						))}
					</Select>
				</Flex>
			) : details.type === 'NUMBERS' ? (
				<Flex direction={'column'} gap={2} justifyContent={'center'}>
					<Button
						className='!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full text-black dark:text-white '
						onClick={openNumberInput}
					>
						<Text>Selected Numbers ({details.numbers?.length ?? 0})</Text>
					</Button>
				</Flex>
			) : (
				<Flex direction={'row'} gap={2} justifyContent={'center'}>
					<Box flex={1}>
						<Multiselect
							disable={isRecipientsLoading}
							displayValue='displayValue'
							placeholder={
								['GROUP', 'GROUP_INDIVIDUAL', 'GROUP_INDIVIDUAL_WITHOUT_ADMINS'].includes(
									details.type
								)
									? 'Select Groups'
									: details.type === 'LABEL'
									? 'Select Labels'
									: 'Select One!'
							}
							onRemove={(selectedList: { id: string }[]) =>
								setSelectedRecipients(selectedList.map((label) => label.id))
							}
							onSelect={(selectedList: { id: string }[]) => {
								dispatch(setRecipientsError(false));
								setSelectedRecipients(selectedList.map((label) => label.id));
							}}
							showCheckbox={true}
							hideSelectedList={true}
							options={recipients.map((item, index) => ({
								...item,
								displayValue: `${index + 1}. ${item.name} (@${item.id.substring(
									item.id.length - 8,
									item.id.length - 5
								)}-${'participants' in item ? item.participants ?? 0 : 0})`,
							}))}
							style={{
								searchBox: {
									border: 'none',
								},
								inputField: {
									width: '100%',
								},
							}}
							className='  bg-[#ECECEC] dark:bg-[#535353] rounded-md border-none '
						/>
					</Box>
					<Button
						flex={1}
						className='!bg-[#ECECEC] dark:!bg-[#535353] rounded-md text-black dark:text-white '
						onClick={openGroupInput}
					>
						<Text>Groups ({details.group_ids?.length ?? 0})</Text>
					</Button>
				</Flex>
			)}
			<NumberInputDialog isOpen={isNumberInputOpen} onClose={closeNumberInput} />
			<GroupIdsInputDialog
				isOpen={isGroupInputOpen}
				onClose={closeGroupInput}
				onConfirm={setSelectedRecipients}
				ids={details.group_ids ?? []}
			/>
		</FormControl>
	);
}
