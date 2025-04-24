'use client';
import React, { useEffect, useRef, useState } from 'react';
import DiscountComboBox from '../DiscountCombobox';
import { formatPrice } from '../../../../../utils/formatPrice';
import Button from '@/app/components/Button';
import { useCart } from '@/app/hooks/useCart';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FieldValues, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import { SafeUser } from '../../../../../types';
import ConfirmDialog from '@/app/components/ConfirmDialog';

interface CheckoutClientProps {
	currentUser: SafeUser | null | undefined;
}
const CheckoutClient: React.FC<CheckoutClientProps> = ({currentUser}) => {
	const router = useRouter();
	const {
		cartTotalAmount,
		cartInfo,
		handleNextStep,
		paymentIntent,
		shippingFee,
		cartProducts,
		setCartInfo,
		handleSetPaymentIntent,
	} = useCart();
	const {
		handleSubmit,
		formState: { errors },
	} = useForm<FieldValues>();
	const [isLoading, setIsLoading] = useState(false);
	const [isCheck, setIsCheck] = useState(false);
	const [isStripeCheck, setStripeCheck] = useState(false);
	const [isMomoCheck, setMomoCheck] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const address = cartInfo?.address + ', ' + cartInfo?.ward + ', ' + cartInfo?.district;

	let value: any;
	const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		value = e.target.value;
		// Lưu phương thức thanh toán vào localStorage
		// @ts-ignore
		const savedInfo = JSON.parse(localStorage.getItem('CartInfo') || '{}');
		const updatedInfo = {
			...savedInfo,
			payment: value,
		};
		setPaymentMethod(value);
		setCartInfo(updatedInfo);
		localStorage.setItem('CartInfo', JSON.stringify(updatedInfo));
	};
	const handleNext = async () => {
		if (!currentUser) {
			setIsOpen(true);
			return;
		}

		if (!paymentMethod) {
			return toast.error('Vui lòng chọn hình thức thanh toán!');
		}

		setIsLoading(true);
		if (paymentMethod === 'cod') {
			handleNextStep();
			axios
				.post('/api/create-payment-intent', {
					products: cartProducts,
					payment_intent_id: paymentIntent,
					phoneNumber: cartInfo.phone,
					address: {
						city: cartInfo.city,
						country: 'Việt Nam',
						line1: address,
						postal_code: '00000',
					},
					shippingFee: shippingFee,
					paymentMethod: cartInfo.payment,
				})
				.then((res) => {
					if (res.status === 401) {
						return router.push('/login');
					}
					handleSetPaymentIntent(res.data.createdOrder.paymentIntentId);
					return res.data;
				})
				.catch((error) => {
					if (error) return;
				})
				.finally(() => {
					setIsLoading(false);
					router.push('/cart/orderconfirmation');
				});
		} else if (paymentMethod === 'stripe') {
			router.push('/stripecheckout');
		} else if (paymentMethod === 'momo') {
			axios
				.post('/api/create-payment-intent', {
					products: cartProducts,
					payment_intent_id: paymentIntent,
					phoneNumber: cartInfo.phone,
					address: {
						city: cartInfo.city,
						country: 'Việt Nam',
						line1: address,
						postal_code: '00000',
					},
					shippingFee: shippingFee,
					paymentMethod: cartInfo.payment,
				})
				.then((res) => {
					if (res.status === 401) {
						return router.push('/login');
					}
					console.log('API response:', res.data);
					router.push(`${res.data.payUrl}`);
					handleSetPaymentIntent(res.data.createdOrder.paymentIntentId);
					return res.data;
				})
				.catch((error) => {
					console.error('API Error:', error);
					if (error) return;
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
		setTimeout(() => {
			setIsLoading(false);
		}, 3000);
	};

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const handleConfirm = () => {
		router.push('/login');
		toggleOpen();
	};

	return (
		<>
		<div className="w-full bg-white p-2 mt-4">
			<h2 className="text-base lg:text-xl font-bold mb-4">Thông tin đặt hàng</h2>

			<div className="mt-4 flex justify-between">
				<div className="w-[28%] font-semibold lg:text-base text-sm">Khách hàng:</div>
				<div className="w-[70%] lg:text-base text-sm">{cartInfo?.name}</div>
			</div>
			<div className="mt-4 flex justify-between">
				<div className="w-[28%] font-semibold lg:text-base text-sm">Số điện thoại:</div>
				<div className="w-[70%] lg:text-base text-sm">{cartInfo?.phone}</div>
			</div>
			<div className="mt-4 flex justify-between">
				<div className="w-[28%] font-semibold lg:text-base text-sm">Địa chỉ nhận hàng</div>
				<div className="w-[70%] lg:text-base text-sm">
					{cartInfo?.address}, {cartInfo?.ward}, {cartInfo?.district}, {cartInfo?.city}
				</div>
			</div>

			<div className="mb-4">
				<div className="flex justify-between mt-4">
					<div className="w-[28%] font-semibold lg:text-base text-sm">Tạm tính:</div>
					<div className="w-[70%] lg:text-base text-sm text-indigo-600 font-semibold">
						{formatPrice(cartTotalAmount - shippingFee)}
					</div>
				</div>
				<div className="flex justify-between mt-4">
					<div className="w-[28%] font-semibold lg:text-base text-sm">Phí vận chuyển:</div>
					<div className="w-[70%] text-indigo-600 font-semibold lg:text-base text-sm">
						{formatPrice(shippingFee)}
					</div>
				</div>
				<div className="flex justify-between mt-4">
					<div className="w-[28%] font-semibold lg:text-base text-sm">Tổng tiền:</div>
					<div className="w-[70%] text-indigo-600 font-semibold lg:text-base text-sm">
						{formatPrice(cartTotalAmount)}
					</div>
				</div>
			</div>

			<div className="py-6 border-t border-b">
				<DiscountComboBox />
			</div>

			<div className="p-6 border-b">
				<h2 className="font-bold mb-2 lg:text-xl text-sm">Chọn hình thức thanh toán</h2>
				<div
					className="flex items-center mt-2"
					onClick={() => {
						setIsCheck(false);
						setStripeCheck(false);
						setMomoCheck(false);
					}}
				>
					<input
						type="radio"
						id="cod"
						name="payment"
						value="cod"
						className="mr-4"
						onChange={handlePaymentChange}
					/>
					<label htmlFor="cod" className="flex items-center">
						<Image
							src="https://file.hstatic.net/200000636033/file/pay_2d752907ae604f08ad89868b2a5554da.png"
							alt="cod"
							className="mr-2"
							width={24}
							height={24}
						/>
						<span className="lg:text-base text-sm">Thanh toán khi giao hàng (COD)</span>
					</label>
				</div>
				<div
					className="flex items-center mt-2"
					onClick={() => {
						setIsCheck(false);
						setMomoCheck(false);
						setStripeCheck(true);
					}}
				>
					<input
						type="radio"
						id="stripe"
						name="payment"
						value="stripe"
						className="mr-4"
						onChange={handlePaymentChange}
					/>
					<label htmlFor="stripe" className="flex items-center">
						<Image src="/stripe-v2-svgrepo-com.svg" alt="stripe" className="mr-2" width={24} height={24} />
						<div className="flex gap-1 items-center lg:text-base text-sm">
							Thanh toán bằng <span className="text-base lg:text-lg text-indigo-600"> Stripe</span>
						</div>
					</label>
				</div>
				<div
					className={`mt-2 ${
						isStripeCheck ? 'transform translate-y-0' : 'transform translate-y-full hidden'
					}`}
				>
					<p>
						Chuyển khoản vào tài khoản<span className="text-indigo-600 font-semibold"> Ví Stripe</span> của
						chúng tôi. Đơn hàng sẽ được xác nhận ngay sau khi chuyển khoản thành công
					</p>
				</div>

				<div
					className="flex items-center mt-2"
					onClick={() => {
						setIsCheck(false);
						setStripeCheck(false);
						setMomoCheck(true);
					}}
				>
					<input
						type="radio"
						id="momo"
						name="payment"
						value="momo"
						className="mr-4"
						onChange={handlePaymentChange}
					/>
					<label htmlFor="momo" className="flex items-center">
						<Image src="/momo.png" alt="momo" className="mr-2" width={24} height={24} />
						<div className="flex gap-1 items-center lg:text-base text-sm">
							Thanh toán bằng <span className="text-base lg:text-lg text-indigo-600"> Momo</span>
						</div>
					</label>
				</div>
				<div
					className={`mt-2 ${isMomoCheck ? 'transform translate-y-0' : 'transform translate-y-full hidden'}`}
				>
					<p>
						Chuyển khoản vào tài khoản<span className="text-indigo-600 font-semibold"> Ví Momo</span> của
						chúng tôi. Đơn hàng sẽ được xác nhận ngay sau khi chuyển khoản thành công
					</p>
				</div>
			</div>

			<div className="flex flex-col mt-5 gap-4">
				<div className="flex justify-between ">
					<span className="font-bold">Phí vận chuyển:</span>
					<span className="font-semibold">{formatPrice(shippingFee)}</span>
				</div>
				<div className="flex justify-between">
					<span className="font-bold">Tổng tiền:</span>
					<span className="text-indigo-600 font-semibold text-xl">{formatPrice(cartTotalAmount)}</span>
				</div>
				<div className="mt-5 pb-3">
					<Button label="THANH TOÁN NGAY" isLoading={isLoading} onClick={handleNext} />
				</div>
			</div>
		</div>
		{isOpen && (
				<ConfirmDialog isOpen={isOpen} handleClose={toggleOpen} alert={true} onConfirm={handleConfirm}>
					Vui lòng đăng nhập để thanh toán
				</ConfirmDialog>
			)}
		</>
	);
};

export default CheckoutClient;
