'use client';
import { useRouter } from 'next/navigation';
import { CiViewList } from 'react-icons/ci';
import { SafeUser } from '../../../../types';
import ConfirmDialog from '../ConfirmDialog';
import { useState } from 'react';

interface OrderTrackingtProps {
	currentUser: SafeUser | null | undefined;
}

const OrderTracking: React.FC<OrderTrackingtProps> = ({ currentUser }) => {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const handleConfirm = () => {
		router.push('/login');
		toggleOpen();
	};

	const handleClick = () => {
		if (currentUser) {
			router.push('/account/orders');
		} else {
			toggleOpen();
		}
	};

	return (
		<>
			<div className="hidden relative cursor-pointer lg:flex justify-center items-center" onClick={handleClick}>
				<div className="text-3xl">
					<CiViewList />
				</div>
			</div>
			{isOpen && (
				<ConfirmDialog isOpen={isOpen} handleClose={toggleOpen} alert={true} onConfirm={handleConfirm}>
					Bạn cần đăng nhập để theo dõi đơn hàng
				</ConfirmDialog>
			)}
		</>
	);
};

export default OrderTracking;
