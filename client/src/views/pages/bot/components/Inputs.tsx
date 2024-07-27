import { Input, Select, Textarea } from '@chakra-ui/react';

export function TextAreaElement({
	value,
	onChange,
	isInvalid,
	placeholder,
	minHeight = '80px',
	onlyLightMode = false,
}: {
	onlyLightMode?:boolean;
	placeholder: string;
	value: string;
	onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
	isInvalid: boolean;
	minHeight?: string;
}) {
	return (
		<Textarea
			width={'full'}
			minHeight={minHeight}
			isInvalid={isInvalid}
			placeholder={placeholder}
			border={'none'}
			className={`text-black   !bg-[#ECECEC] ${onlyLightMode ? '' : 'dark:text-white dark:!bg-[#535353]'} `}
			_placeholder={{ opacity: 0.4, color: 'inherit' }}
			_focus={{ border: 'none', outline: 'none' }}
			value={value}
			onChange={onChange}
		/>
	);
}

export function SelectElement({
	options,
	value,
	onChangeText,
	size = 'md',
}: {
	options: { title: string; value: string }[];
	value: string;
	onChangeText: (text: string) => void;
	size?: string;
}) {
	return (
		<Select
			className={'!bg-[#ECECEC] dark:!bg-[#535353] rounded-md w-full  text-black dark:text-white'}
			border={'none'}
			value={value}
			rounded={'md'}
			size={size}
			onChange={(e) => onChangeText(e.target.value)}
		>
			{options.map((option, index) => (
				<option
					key={index}
					className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353] '
					value={option.value}
				>
					{option.title}
				</option>
			))}
		</Select>
	);
}

export function NumberInput({
	value,
	onChangeText,
}: {
	value: number;
	onChangeText: (value: number) => void;
}) {
	return (
		<Input
			type='number'
			placeholder='10'
			size={'md'}
			rounded={'md'}
			border={'none'}
			className='text-black dark:text-white  !bg-[#ECECEC] dark:!bg-[#535353]'
			_focus={{
				border: 'none',
				outline: 'none',
			}}
			value={value}
			onChange={(e) => onChangeText(Number(e.target.value))}
		/>
	);
}

export function TextInput({
	value,
	onChangeText,
	placeholder,
	onlyLightMode = false,
}: {
	onlyLightMode?: boolean;
	value: string;
	placeholder: string;
	onChangeText: (value: string) => void;
}) {
	return (
		<Input
			type='text'
			placeholder={placeholder}
			size={'md'}
			rounded={'md'}
			border={'none'}
			className={`text-black ${
				onlyLightMode ? '' : 'dark:text-white dark:!bg-[#535353]'
			} !bg-[#ECECEC] `}
			_focus={{
				border: 'none',
				outline: 'none',
			}}
			value={value}
			onChange={(e) => onChangeText(e.target.value)}
		/>
	);
}
