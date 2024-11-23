import {
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
	setCampaignName,
	setCampaignNameError,
	setDescription,
	setRecipientsData,
	setRecipientsError,
	setRecipientsFrom,
	setVariables,
} from '../../../../store/reducers/SchedulerByDateReducer';
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
	} = useSelector((state: StoreState) => state[StoreNames.SCHEDULER_BY_DATE]);
	const dispatch = useDispatch();

	return (
		<VStack flex={1}>
			<Flex gap={'2rem'} width={'full'}>
				<FormControl isInvalid={campaignNameError} flex={1}>
					<FormLabel color={theme === 'dark' ? 'white' : 'zinc.500'}>Campaign Name</FormLabel>
					<Input
						color={theme === 'dark' ? 'white' : 'gray.800'}
						type='text'
						value={details.title}
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

	const { details } = useSelector((state: StoreState) => state[StoreNames.SCHEDULER_BY_DATE]);

	const { userType } = useSelector((state: StoreState) => state[StoreNames.USER]);

	return (
		<FormControl flex={1}>
			<FormLabel color={theme === 'dark' ? 'white' : 'GrayText'}>Recipients From</FormLabel>
			<Select
				className={`!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full ${
					details.recipient_from
						? ' text-black dark:text-white'
						: ' text-gray-700 dark:text-gray-400'
				}`}
				border={'none'}
				value={details.recipient_from}
				onChange={(e) => {
					dispatch(
						setRecipientsFrom(
							e.target.value as 'NUMBERS' | 'CSV' | 'GROUP' | 'LABEL' | 'GROUP_INDIVIDUAL'
						)
					);
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
		details,
		recipients,
		isRecipientsLoading,
		ui: { recipientsError },
	} = useSelector((state: StoreState) => state[StoreNames.SCHEDULER_BY_DATE]);
	const dispatch = useDispatch();

	const setSelectedRecipients = (ids: string[]) => {
		if (details.recipient_from === 'GROUP' || details.recipient_from === 'GROUP_INDIVIDUAL') {
			dispatch(setRecipientsData(ids));
		} else if (details.recipient_from === 'LABEL') {
			dispatch(setRecipientsData(ids));
		}
	};

	return (
		<FormControl
			alignItems='flex-end'
			justifyContent={'space-between'}
			width={'full'}
			flex={1}
			isInvalid={recipientsError}
		>
			<FormLabel color={theme === 'dark' ? 'white' : 'GrayText'}>
				{details.recipient_from === 'NUMBERS' ? 'Selected Numbers' : 'Choose Existing Database'}
			</FormLabel>
			{details.recipient_from === 'CSV' ? (
				<Flex direction={'column'} gap={2}>
					<Select
						className='!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full text-black dark:text-white '
						border={'none'}
						value={details.recipient_data}
						onChange={(e) => {
							dispatch(setRecipientsError(false));
							dispatch(setRecipientsData(e.target.value));
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
			) : details.recipient_from === 'NUMBERS' ? (
				<Flex direction={'column'} gap={2} justifyContent={'center'}>
					<Button
						className='!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full text-black dark:text-white '
						onClick={openNumberInput}
					>
						<Text>Selected Numbers ({details.recipient_data?.length ?? 0})</Text>
					</Button>
				</Flex>
			) : (
				<Multiselect
					disable={isRecipientsLoading}
					displayValue='displayValue'
					placeholder={
						details.recipient_from === 'GROUP'
							? 'Select Groups'
							: details.recipient_from === 'GROUP_INDIVIDUAL'
							? 'Select Groups'
							: details.recipient_from === 'LABEL'
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
						displayValue: `${index + 1}. ${item.name}`,
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
			)}
			<NumberInputDialog isOpen={isNumberInputOpen} onClose={closeNumberInput} />
		</FormControl>
	);
}
