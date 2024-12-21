import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const discounts = [
	{ id: 1, code: 'THGVN500', amount: 500000, minOrder: 6000000, expiry: '08 Thg 08, 2024' },
	{ id: 2, code: 'KVCGVN500', amount: 500000, minOrder: 6000000, expiry: '08 Thg 08, 2024' },
	{ id: 3, code: 'MHTGVN500', amount: 500000, minOrder: 6000000, expiry: '08 Thg 08, 2024' },
	{ id: 4, code: 'THGVN300', amount: 300000, minOrder: 3500000, expiry: '08 Thg 08, 2024' },
	{ id: 5, code: 'KVCGVN300', amount: 300000, minOrder: 3500000, expiry: '08 Thg 08, 2024' },
	{ id: 6, code: 'MHTGVN300', amount: 300000, minOrder: 3500000, expiry: '08 Thg 08, 2024' },
];

const DiscountComboBox = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedDiscount, setSelectedDiscount] = useState(null);

	const toggleOpen = () => setIsOpen(!isOpen);

	return (
		<div className="relative">
			<div
				className="cursor-pointer flex items-center w-[55%] lg:w-2/5 justify-between bg-white border rounded px-3 py-2 text-blue-600 border-gray-300"
				onClick={toggleOpen}
			>
				<svg viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4">
					<path
						d="M12.8 4L14 5.2L7.2 12L6 10.8L12.8 4ZM2 0H18C19.11 0 20 0.89 20 2V6C19.4696 6 18.9609 6.21071 18.5858 6.58579C18.2107 6.96086 18 7.46957 18 8C18 8.53043 18.2107 9.03914 18.5858 9.41421C18.9609 9.78929 19.4696 10 20 10V14C20 15.11 19.11 16 18 16H2C1.46957 16 0.960859 15.7893 0.585786 15.4142C0.210714 15.0391 0 14.5304 0 14V10C1.11 10 2 9.11 2 8C2 7.46957 1.78929 6.96086 1.41421 6.58579C1.03914 6.21071 0.530433 6 0 6V2C0 1.46957 0.210714 0.960859 0.585786 0.585786C0.960859 0.210714 1.46957 0 2 0ZM2 2V4.54C2.60768 4.8904 3.11236 5.39466 3.46325 6.00205C3.81415 6.60944 3.9989 7.29854 3.9989 8C3.9989 8.70146 3.81415 9.39056 3.46325 9.99795C3.11236 10.6053 2.60768 11.1096 2 11.46V14H18V11.46C17.3923 11.1096 16.8876 10.6053 16.5367 9.99795C16.1858 9.39056 16.0011 8.70146 16.0011 8C16.0011 7.29854 16.1858 6.60944 16.5367 6.00205C16.8876 5.39466 17.3923 4.8904 18 4.54V2H2ZM7.5 4C8.33 4 9 4.67 9 5.5C9 6.33 8.33 7 7.5 7C6.67 7 6 6.33 6 5.5C6 4.67 6.67 4 7.5 4ZM12.5 9C13.33 9 14 9.67 14 10.5C14 11.33 13.33 12 12.5 12C11.67 12 11 11.33 11 10.5C11 9.67 11.67 9 12.5 9Z"
						fill="#1982F9"
					></path>
				</svg>
				<span>Sử dụng mã giảm giá</span>
				{isOpen ? <FiChevronUp /> : <FiChevronDown />}
			</div>
			{isOpen && (
				<div className="z-10 w-full mt-2 bg-white border border-gray-300 rounded shadow-lg">
					<input
						type="text"
						className="w-full px-4 py-2 border-b border-gray-300"
						placeholder="Nhập mã giảm giá/Phiếu mua hàng"
					/>
					<div className="p-2">
						{discounts.map((discount) => (
							<div
								key={discount.id}
								className="flex items-center justify-between p-2 border-b last:border-0 border-gray-300"
							>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
										<span className="text-lg font-bold text-green-600">%</span>
									</div>
									<div className="ml-4">
										<p className="text-sm font-medium text-gray-700">
											Giảm {discount.amount.toLocaleString('vi-VN')}đ
										</p>
										<p className="text-xs text-gray-500">
											Đơn hàng từ {discount.minOrder.toLocaleString('vi-VN')}đ
										</p>
										<p className="text-xs text-gray-500">Mã: {discount.code}</p>
										<p className="text-xs text-gray-500">HSD: {discount.expiry}</p>
									</div>
								</div>
								<button
									className="px-4 py-2 text-white bg-blue-600 rounded"
									// onClick={() => setSelectedDiscount(discount)}
								>
									Áp dụng
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default DiscountComboBox;
