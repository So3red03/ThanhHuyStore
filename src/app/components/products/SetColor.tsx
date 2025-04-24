'use client';

import { CartProductType, selectedImgType } from '@/app/(home)/product/[productId]/ProductDetails';
import { usePathname } from 'next/navigation';

interface SetColorProps {
	cartProduct: CartProductType;
	product: any;
	handleColorSelect: (value: selectedImgType) => void;
	performance?: boolean;
}

const SetColor: React.FC<SetColorProps> = ({ product, cartProduct, handleColorSelect, performance }) => {
	const pathname = usePathname();
	const isProductDetail = pathname?.includes('/product/'); 
	return (
		<div className={`flex items-center gap-4 select-none ${
				isProductDetail ? '' : 'justify-center'
			}`}
		>
			<span className={`font-semibold ${performance ? 'hidden' : ' block'}`}>Màu sắc: </span>
			<div className="flex gap-1">
				{product.images.map((image: selectedImgType) => {
					return (
						<div
							key={image.color}
							onClick={e => {
								e.stopPropagation(); // Ngăn sự kiện click nổi lên
								handleColorSelect(image);
							}}
							className={`${
								performance ? 'h-4 w-4 border-none' : 'h-7 w-7'
							} rounded-full border-teal-300 flex items-center justify-center ${
								cartProduct.selectedImg.color === image.color ? 'border-[1.5px]' : 'boder-none'
							}`}
						>
							<div
								style={{ background: image.colorCode }}
								className={`${
									performance ? 'h-4 w-4 border-[0.1px]' : 'h-6 w-6'
								} rounded-full border-[1.2px] border-slate-300 cursor-pointer`}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default SetColor;
