'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '../../hooks/useCart';
import { CiShoppingCart } from 'react-icons/ci';
import Link from 'next/link';
const CartCount = () => {
	const { cartTotalQty } = useCart();
	return (
		<Link href={'/cart'} className="relative cursor-pointer">
			<div className="text-3xl">
				<CiShoppingCart />
			</div>
			<span
				className={`absolute top-[-5px] right-[-7px] text-white h-5 w-5 rounded-full flex items-center justify-center text-xs`}
				style={{ backgroundColor: '#D43232' }}
			>
				{cartTotalQty}
			</span>
		</Link>
	);
};

export default CartCount;
