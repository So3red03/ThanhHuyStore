'use client';
import { useCart } from '@/app/hooks/useCart';
import Image from 'next/image';
import { truncateText } from '../../../../utils/truncateText';
import { formatPrice } from '../../../../utils/formatPrice';
import { useState } from 'react';

interface RelatedProductsProps {
	product: any;
	cartProduct: any;
}
const RelatedProducts: React.FC<RelatedProductsProps> = ({ product, cartProduct }) => {
	const accessories = [
		{
			id: 1,
			name: 'Cường lực Apple iPhone 15 series',
			price: 350000,
			imgSrc: '/productImg/ipads/ipad-air-5-wifi-startlight-650x650-1.png',
		},
		{
			id: 2,
			name: 'Cường lực Camera UNIQ OPTIX for iPhone',
			price: 350000,
			imgSrc: '/productImg/ipads/ipad-gen-9-grey-650x650-1.png',
		},
		{
			id: 3,
			name: 'Sạc 20W USB-C Power Adapter',
			price: 520000,
			imgSrc: '/productImg/ipads/ipad-pro-m1-11-inch-cellular-wifi-silver-650x650-1.png',
		},
		// {
		// 	id: 4,
		// 	name: 'Sạc 20W USB-C Power Adapter',
		// 	price: 510000,
		// 	imgSrc: '/productImg/ipads/ipad-pro-m1-11-inch-cellular-wifi-silver-650x650-1.png',
		// },
		// {
		// 	id: 5,
		// 	name: 'Sạc 20W USB-C Power Adapter',
		// 	price: 500000,
		// 	imgSrc: '/productImg/ipads/ipad-gen-9-grey-650x650-1.png',
		// },
	];
	const [selectedProducts, setSelectedProducts] = useState<any>([]);

	const handleSelectProduct = (product: any) => {
		setSelectedProducts((prevSelected: any) => {
			if (prevSelected.includes(product)) {
				return prevSelected.filter((item: any) => item !== product);
			} else {
				return [...prevSelected, product];
			}
		});
	};
	return (
		<>
			{/* Related Products  */}
			<h1 className="font-semibold text-3xl m-14 mt-44 whitespace-nowrap">Mua kèm giá sốc</h1>
			<div className="flex items-center justify-between px-10 flex-col lg:flex-row">
				{/* Main Product */}
				<div className="flex flex-col items-center gap-3">
					<div className="aspect-square overflow-hidden relative w-full">
						<Image
							src={cartProduct.selectedImg.images[0]}
							alt={product.name}
							width={220}
							height={200}
							className="h-auto mb-1"
						/>
					</div>
					<h3 className="text-lg font-semibold">{truncateText(product.name)}</h3>
					<div className="text-xl font-bold text-[#d43232]">{formatPrice(product.price)}</div>
					{/* <div className="text-sm text-gray-500 line-through">24.990.000₫</div>
						<div className="text-sm text-green-500">-20%</div> */}
				</div>
				<div>
					<span className="plus-icon mr-2 text-[#9fa6a8] text-4xl"></span>
				</div>
				{/* Accessories */}
				<div className="flex items-center">
					{/* Navigation */}
					<button className="bg-gray-200 rounded-full w-10 h-10">&#x3c;</button>

					<div className="flex space-x-4">
						{accessories.map((product) => (
							<div
								key={product.id}
								onClick={() => handleSelectProduct(product.id)}
								className="cursor-pointer flex flex-col items-center p-4 pt-8 px-1 border relative rounded-lg"
							>
								<input
									type="checkbox"
									checked={selectedProducts.includes(product.id)}
									onChange={() => handleSelectProduct(product.id)}
									className="mb-2 ml-4 mt-4 absolute top-0 left-0 w-4 h-4"
								/>
								<Image
									src={product.imgSrc}
									alt={product.name}
									width={130}
									height={170}
									className="h-auto mb-2"
								/>
								<h4 className="text-sm font-medium text-center">{truncateText(product.name)}</h4>
								<div className="text-sm mt-1">
									Giá niêm yết:{' '}
									<span className="font-bold text-[#d43232]"> {product.price.toLocaleString()}₫</span>
								</div>
								<button
									onClick={() => handleSelectProduct(product.id)}
									className="mt-2 text-sm text-blue-500 bg-white border border-blue-500 rounded-md px-5 py-2"
								>
									Chọn sản phẩm
								</button>
							</div>
						))}
					</div>

					{/* Navigation */}
					<button className="bg-gray-200 rounded-full w-10 h-10">&#x3e;</button>
				</div>

				{/* Total Price */}
				<div className="flex flex-col items-center h-full">
					<div className="text-xl font-bold text-[#d43232]">
						{(
							product.price +
							selectedProducts.reduce((total: any, productId: any) => {
								const product = accessories?.find((item: any) => item.id === productId);
								return total + (product ? product.price : 0);
							}, 0)
						).toLocaleString()}
						₫
					</div>
					<div className="text-sm text-gray-500">Tiết kiệm: 0₫</div>
					<button className="flex items-center mt-4 border text-md font-semibold text-white bg-slate-700 rounded-xl hover:opacity-80 transition py-4 px-8">
						Mua {selectedProducts.length + 1} sản phẩm
					</button>
				</div>
			</div>
		</>
	);
};

export default RelatedProducts;
