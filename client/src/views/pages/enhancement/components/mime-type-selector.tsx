import Multiselect from 'multiselect-react-dropdown';
import { MIME_TYPES } from '../../../../config/const';

type MimeSelectorDialogProps = {
	onChange: (selectedList: string[]) => void;
	selectedValue: string[];
	exclude_options?: string;
};

const MimeSelector = ({ onChange, selectedValue, exclude_options }: MimeSelectorDialogProps) => {
	return (
		<Multiselect
			displayValue='name'
			placeholder='Select Extensions'
			onRemove={(selectedList) =>
				onChange(selectedList.map((item: { name: string; value: string }) => item.value))
			}
			onSelect={(selectedList) =>
				onChange(selectedList.map((item: { name: string; value: string }) => item.value))
			}
			showCheckbox={true}
			selectedValues={(selectedValue ?? []).map((value) => {
				return MIME_TYPES.find((item) => item.value === value);
			})}
			options={
				exclude_options ? MIME_TYPES.filter((item) => item.value !== exclude_options) : MIME_TYPES
			}
			style={{
				searchBox: {
					border: 'none',
				},
			}}
			className='text-black !bg-[#ECECEC] !w-[450px] rounded-md border-none '
		/>
	);
};

export default MimeSelector;
