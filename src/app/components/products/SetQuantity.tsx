'use client';

import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';

interface setQtyProps {
	cartCounter?: boolean;
	cartProduct: CartProductType;
	handleQtyIncrease: () => void;
	handleQtyDecrease: () => void;
}

const btnStyle = 'p-1 px-3 border-x-[1.2px] border-slate-300';

const SetQuantity: React.FC<setQtyProps> = ({ cartCounter, cartProduct, handleQtyIncrease, handleQtyDecrease }) => {
	return (
		<div className="flex gap-8 items-center">
			{cartCounter ? null : <div className="font-semibold">QUANTITY: </div>}
			<div className="flex gap-4 items-center text-base border-y-[1.2px] border-slate-300">
				<button onClick={handleQtyDecrease} className={btnStyle}>
					-
				</button>
				<div className="px-2">{cartProduct.quantity}</div>
				<button onClick={handleQtyIncrease} className={btnStyle}>
					+
				</button>
			</div>
		</div>
	);
};

export default SetQuantity;
