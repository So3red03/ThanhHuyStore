'use client';

import Image from 'next/image';
import { IconType } from 'react-icons';

interface ButtonProps {
	label: string | React.ReactNode;
	disabled?: boolean;
	outline?: boolean;
	small?: boolean;
	custom?: string;
	icon?: IconType;
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
	isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, disabled, outline, small, custom, onClick, icon: Icon, isLoading }) => {
	return (
		<button
			onClick={onClick}
			disabled={disabled || isLoading}
			className={`disabled:opacity-70 disabled:cursor-not-allowed rounded-md hover:opacity-80 transition w-full border-slate-600 flex items-center justify-center gap-2 relative ${
				outline ? 'bg-white text-slate-600' : 'bg-slate-600 text-white'
			} ${small ? 'text-sm-700 font-light py-1 px-2 border-[1px]' : 'text-md font-semibold py-3 px-4 border-2'} ${
				custom ? custom : ''
			}
			}`}
		>
			{Icon && <Icon size={24} />}
			<span className={`${isLoading ? 'invisible' : 'visible'}`}>{label}</span>
			{isLoading && (
				<div className="absolute">
					<Image src="/loader2.svg" alt="Loading" width={37} height={37} />
				</div>
			)}
		</button>
	);
};

export default Button;
