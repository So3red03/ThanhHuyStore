'use client';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiShoppingCart, FiFileText, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { FaShoppingBag } from 'react-icons/fa';
import { useCart } from '@/app/hooks/useCart';

const CartTracking: React.FC = () => {
	const router = useRouter();
	const { step, handleGoToStep } = useCart();

	return (
		<div className="flex justify-center bg-slate-200 items-center flex-col p-4 lg:pb-10 pb-7 rounded-md ">
			<div className="flex justify-between w-full px-8">
				<Step icon={<FaShoppingBag />} title="Giỏ hàng" active={step >= 1} onClick={() => handleGoToStep(1)} />
				<StepConnector active={step >= 2} />
				<Step
					icon={<FiFileText />}
					title="Thông tin đặt hàng"
					active={step >= 2}
					onClick={() => handleGoToStep(2)}
				/>
				<StepConnector active={step >= 3} />
				<Step icon={<FiCreditCard />} title="Thanh toán" active={step >= 3} onClick={() => handleGoToStep(3)} />
				<StepConnector active={step >= 4} />
				<Step icon={<FiCheckCircle />} title="Hoàn tất" active={step >= 4} onClick={() => {}} />
			</div>
		</div>
	);
};

const Step: React.FC<{
	icon: React.ReactNode;
	title: string;
	active: boolean;
	onClick: () => void;
}> = ({ icon, title, active, onClick }) => {
	return (
		<>
			<div
				className={`relative flex flex-col items-center cursor-pointer ${
					active ? 'text-slate-700' : 'text-gray-400'
				}`}
				onClick={onClick}
			>
				<div
					className={`p-2 rounded-full ${
						active ? 'bg-slate-700 border text-white' : 'bg-white border border-gray-400'
					}`}
				>
					{icon}
				</div>
				<span className="mt-0 lg:mt-2 absolute lg:bottom-[-1.8rem] bottom-[-1.3rem] whitespace-nowrap text-xs lg:text-base">
					{title}
				</span>
			</div>
		</>
	);
};

const StepConnector: React.FC<{ active: boolean }> = ({ active }) => {
	return (
		<div
			className={`relative flex-1 mt-4 border-t-2 w-full ${
				active ? 'border-slate-600 border-solid' : 'border-gray-300 border-dashed'
			}`}
			style={{ height: 2 }}
		></div>
	);
};

export default CartTracking;
