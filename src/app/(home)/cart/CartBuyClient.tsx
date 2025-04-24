'use client';
import Link from 'next/link';
import { useCart } from '../../hooks/useCart';
import { MdArrowBack } from 'react-icons/md';
import Button from '../../components/Button';
import ItemContent from './ItemContent';
import { formatPrice } from '../../../../utils/formatPrice';
import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../types';
import toast from 'react-hot-toast';
import DiscountComboBox from './DiscountCombobox';
import { useEffect, useState } from 'react';

interface CartBuyClientProps {
	currentUser: SafeUser | null | undefined;
}

const CartBuyClient: React.FC<CartBuyClientProps> = ({ currentUser }) => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const { cartProducts, cartTotalAmount, handleNextStep, setStep } = useCart();

	useEffect(() => {
		setStep(1);
	}, []);

	// Ràng buộc
	const handleCheckout = () => {
		setIsLoading(true);
		if (cartTotalAmount > 99000000) {
			toast.error('Tổng giá trị đơn hàng không được vượt quá 99tr VND');
			setIsLoading(false);
			return;
		}
		handleNextStep();
		setTimeout(() => {
			router.push('/cart/cartinfo');
			setIsLoading(false);
		}, 1000);
	};

	return !cartProducts || cartProducts.length === 0 ? (
		<div className="flex flex-col items-center">
			<div className="text-base lg:text-xl">Giỏ hàng của bạn trống</div>
			<div>
				<Link href={'/'} className="text-slate-500 flex items-center gap-1 mt-2">
					<MdArrowBack />
					<span className="text-base">Bắt đầu mua sắm </span>
				</Link>
			</div>
		</div>
	) : (
		<div className="bg-white p-2 rounded-lg mt-4">
			{cartProducts.map((product) => {
				return <ItemContent key={product.id} item={product} />;
			})}
			<div className="py-6 border-t border-b">
				<DiscountComboBox />
			</div>
			<div className="flex flex-col mt-5 gap-4">
				<div className="flex justify-between ">
					<span className="font-bold">Phí vận chuyển:</span>
					<span className="font-semibold">{formatPrice(40000)}</span>
				</div>
				<div className="flex justify-between">
					<span className="font-bold">Tổng tiền:</span>
					<span className="text-indigo-600 font-semibold text-xl">
						{formatPrice(cartTotalAmount + 40000)}
					</span>
				</div>
				<div className="mt-5 pb-3">
					<Button label="ĐẶT HÀNG NGAY" isLoading={isLoading} onClick={handleCheckout} />
				</div>
			</div>
		</div>
	);
};

export default CartBuyClient;
