'use client';

import { useEffect, useState } from 'react';
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';

interface InputProps {
	id: string;
	label?: string;
	placeholder?: string;
	type?: string;
	disabled?: boolean;
	required?: boolean;
	register: UseFormRegister<FieldValues>;
	errors: FieldErrors<FieldValues>;
	className?: string;
	defaultValue?: string | null;
	toggleVisibility?: boolean;
	onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	options?: any[];
	cartInfo?: boolean;
}

const Input: React.FC<InputProps> = ({
	id,
	label,
	placeholder,
	type,
	disabled,
	register,
	required,
	errors,
	defaultValue,
	toggleVisibility,
	className,
	onKeyDown,
	options,
	cartInfo,
	onChange,
}) => {
	const [hasValue, setHasValue] = useState(false);
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	useEffect(() => {
		setHasValue(defaultValue !== ''); // Đồng bộ trạng thái
	}, [defaultValue]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setHasValue(event.target.value !== '');
	};
	const handleChangeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setHasValue(event.target.value !== '');
	};

	const handleToggleVisibility = () => {
		setIsPasswordVisible(!isPasswordVisible);
	};

	// Trả về các ràng buộc dựa trên type
	const validationRules = () => {
		if (type === 'email') {
			return { required, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ };
		}
		if (type === 'number') {
			return { required, min: 0 };
		}
		if (type === 'text') {
			return { required, minLength: 1 };
		}
		if (type === 'password') {
			return { required, minLength: 6 };
		}
		return { required };
	};

	return (
		<div className="w-full relative">
			{type === 'combobox' ? (
				<>
					<select
						id={id}
						disabled={disabled}
						{...register(id, { required: true })}
						defaultValue={defaultValue || ''}
						aria-placeholder={placeholder}
						className={`peer w-full p-4 pt-6 outline-none bg-white font-light border-2 rounded-md transition disabled:opacity-70 disabled:cursor-not-allowed 
						${errors[id] ? 'border-rose-400' : 'border-slate-300'} 
						${errors[id] ? 'focus:border-rose-400' : 'focus:border-slate-500'}
						${className}`}
						onChange={handleChangeSelect}
					>
						{options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<label
						htmlFor={id}
						className={`absolute text-md duration-150 transform top-5 z-10 origin-[0] left-4 peer-focus:scale-75 peer-focus:-translate-y-4 
						${hasValue ? 'scale-75 -translate-y-4' : 'scale-100 translate-y-0'} 
						${errors[id] ? 'text-rose-400' : 'text-slate-400'}`}
					>
						{label}
					</label>
				</>
			) : (
				<>
					<input
						onKeyDown={onKeyDown}
						autoComplete="off"
						id={id}
						onFocus={(e) =>
							e.target.addEventListener(
								'wheel',
								function (e) {
									e.preventDefault();
								},
								{ passive: false }
							)
						}
						disabled={disabled}
						defaultValue={defaultValue || ''}
						{...register(id, validationRules())}
						placeholder={placeholder}
						type={isPasswordVisible && type === 'password' ? 'text' : type}
						onChange={handleChange || onChange}
						className={`peer w-full p-4 pt-6 outline-none bg-white font-light border-2 rounded-md transition disabled:opacity-70 disabled:cursor-not-allowed 
						${errors[id] ? 'border-rose-400' : 'border-slate-300'} 
						${errors[id] ? 'focus:border-rose-400' : 'focus:border-slate-500'}
						${className}`}
					/>
					<label
						htmlFor={id}
						className={`absolute text-md duration-150 transform ${
							cartInfo ? 'top-3' : 'top-5'
						} z-10 origin-[0] left-4 peer-focus:scale-75 peer-focus:-translate-y-4 
						${hasValue ? 'scale-75 -translate-y-4' : 'scale-100 translate-y-0'} 
						${errors[id] ? 'text-rose-400' : 'text-slate-400'}`}
					>
						{label}
					</label>
					{toggleVisibility && type === 'password' && (
						<div
							className="absolute right-4 top-6 cursor-pointer text-slate-400 text-lg"
							onClick={handleToggleVisibility}
						>
							{isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
						</div>
					)}
					{errors[id] && (
						<p className="text-rose-400 text-sm mt-1">
							{type === 'email' && 'Email không hợp lệ'}
							{type === 'password' && 'Mật khẩu phải trên 6 kí tự'}
							{type === 'name' && 'Tài khoản không được bỏ trống'}
						</p>
					)}
				</>
			)}
		</div>
	);
};

export default Input;
