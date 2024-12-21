'use client';

import { FieldValues, UseFormRegister } from 'react-hook-form';

interface CheckBoxProps {
	id: string;
	label: string;
	disabled?: boolean;
	register: UseFormRegister<FieldValues>;
}

const CheckBox: React.FC<CheckBoxProps> = ({ id, label, disabled, register }) => {
	return (
		<div className="w-full flex gap-2 items-center">
			<input type="checkbox" id={id} disabled={disabled} {...register(id)} className="cursor-pointer" />
			<label htmlFor={id} className="font-medium cursor-pointer">
				{label}
			</label>
		</div>
	);
};

export default CheckBox;
