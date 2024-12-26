'use client';

import Image from 'next/image';
import { truncateText } from '../../../../utils/truncateText';
import { formatPrice } from '../../../../utils/formatPrice';
import { Rating } from '@mui/material';
import SetColor from './SetColor';
import { useCallback, useEffect, useState } from 'react';
import { CartProductType, selectedImgType } from '@/app/(home)/product/[productId]/ProductDetails';
import Link from 'next/link';
import { slugConvert } from '../../../../utils/Slug';

interface ProductCardProps {
	data: any;
}

const ProductCard: React.FC<ProductCardProps> = ({ data }) => {
	// Hàm trả về số reviews trung bình
	// const productRating = data.reviews.reduce((acc: number, item: any) => item.rating + acc, 0) / data.reviews.length;
	// Check color hiện tại và img thay đổi theo color đc select
	const [cartProduct, setCartProduct] = useState<CartProductType>({
		id: data.id,
		name: data.name,
		description: data.description,
		category: data.category,
		selectedImg: { ...data.images[0] },
		quantity: 1,
		price: data.price,
		inStock: data.inStock
	});

	const handleColorSelect = useCallback((value: selectedImgType) => {
		setCartProduct(prev => {
			return { ...prev, selectedImg: value };
		});
	}, []);

	const [viewedProducts, setViewedProducts] = useState<CartProductType[] | null>(null);

	useEffect(() => {
		const viewedProducts: any = localStorage.getItem('viewedProducts');
		if (viewedProducts) {
			setViewedProducts(JSON.parse(viewedProducts));
		}
	}, []);

	const saveViewedProduct = useCallback((product: CartProductType) => {
		setViewedProducts(prev => {
			if (!prev) return [product];

			const updatedViewed = prev.filter(p => p.id !== product.id);
			updatedViewed.unshift(product);

			if (updatedViewed.length > 8) {
				updatedViewed.pop();
			}

			localStorage.setItem('viewedProducts', JSON.stringify(updatedViewed));
			return updatedViewed;
		});
	}, []);

	return (
		<div className="col-span-1 cursor-pointer border-[1.2px] border-none bg-white rounded-sm p-2 transition hover:scale-105 text-center text-sm">
			<Link
				href={`/product/${slugConvert(data.name)}-${data.id}`}
				onClick={() => saveViewedProduct(data)}
				className="flex flex-col items-center gap-1 w-full"
			>
				<div className="aspect-square overflow-hidden relative w-full">
					<Image
						src={cartProduct.selectedImg.images[0]}
						alt={data.name}
						fill
						sizes="100%"
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				</div>
				<div className="mt-3 text-base h-11">{truncateText(data.name)}</div>
				<div className="font-semibold text-lg mt-2">{formatPrice(data.price)}</div>
			</Link>
			<div className="py-4 px-14">
				<SetColor
					cartProduct={cartProduct}
					product={data}
					handleColorSelect={handleColorSelect}
					performance={true}
				/>
			</div>
			{/* <div>
		<Rating value={productRating} />
	</div> */}
			{/* <div>{data.reviews.length} reviews</div> */}
		</div>
	);
};

export default ProductCard;
