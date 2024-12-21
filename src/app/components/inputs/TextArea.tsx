'use client';

import { useEffect, useState } from 'react';
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';

interface TextArearops {
	id: string;
	label: string;
	disabled?: boolean;
	required?: boolean;
	register: UseFormRegister<FieldValues>;
	errors: FieldErrors<FieldValues>;
	defaultValue?: string;
	className?: string;
}

const TextArea: React.FC<TextArearops> = ({
	id,
	label,
	disabled,
	register,
	required,
	errors,
	defaultValue,
	className,
}) => {
	const [hasValue, setHasValue] = useState(false);

	useEffect(() => {
		if (defaultValue) {
			setHasValue(true);
		}
	}, [defaultValue]);

	const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setHasValue(event.target.value !== '');
	};
	return (
		<div className="w-full relative">
			<textarea
				id={id}
				disabled={disabled}
				{...register(id, { required })}
				placeholder=" "
				defaultValue={defaultValue}
				onChange={handleChange}
				className={`peer w-full p-4 pt-6 max-h-[150px] min-h-[150px] outline-none bg-white font-light border-2 rounded-md transition disabled:opacity-70 disabled:cursor-not-allowed 
				${errors[id] ? '!border-rose-400' : '!border-slate-300'} ${
					errors[id] ? '!focus:border-rose-400' : 'focus:!border-slate-500'
				}${className}`}
			/>
			<label
				htmlFor={id}
				className={`absolute text-md duration-150 transform -translate-y-3 top-5 z-10 origin-[0] left-4 
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
                peer-focus:scale-75 peer-focus:-translate-y-4 
                ${errors[id] ? '!text-rose-400' : '!text-slate-400'}
				${hasValue ? 'scale-75 -translate-y-4' : 'scale-100 translate-y-0'} `}
			>
				{label}
			</label>
		</div>
	);
};

export default TextArea;
