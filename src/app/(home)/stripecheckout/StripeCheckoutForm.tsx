'use client';

import { useElements, useStripe, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { useCart } from '../../hooks/useCart';
import { useEffect, useState } from 'react';
import { formatPrice } from '../../../../utils/formatPrice';
import toast from 'react-hot-toast';
import Heading from '../../components/Heading';
import Button from '../../components/Button';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface StripeCheckoutFormProps {
	clientSecret: string;
	handleSetPaymentSuccess: (value: boolean) => void;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({ clientSecret, handleSetPaymentSuccess }) => {
	const { cartTotalAmount, handleClearCart, cartProducts, handleNextStep, cartInfo } = useCart();
	const router = useRouter();
	const stripe = useStripe();
	const elements = useElements();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!stripe) return;

		if (!clientSecret) return;

		handleSetPaymentSuccess(false);
	}, [stripe, clientSecret, handleSetPaymentSuccess]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) return;

		setIsLoading(true);

		stripe
			.confirmPayment({
				elements,
				redirect: 'if_required',
			})
			.then(async (result) => {
				if (!result.error) {
					toast.success('Thanh toán thành công');

					// Cập nhật lại số lượng tồn kho của các sản phẩm sau khi thanh toán thành công
					await cartProducts?.map((product) => {
						return axios.put(`/api/updateStock/${product.id}`, {
							quantity: product.quantity,
						});
					});

					handleClearCart();
					handleSetPaymentSuccess(true);
				}
				setIsLoading(false);
			});
	};

	return (
		<form onSubmit={handleSubmit} id="payment-form">
			<div className="mb-6">
				<Heading title="Nhập thông tin của bạn để thanh toán">
					<></>
				</Heading>
			</div>
			<h2 className="font-semibold mt-4 mb-2">Thông tin cá nhân</h2>
			<AddressElement
				options={{
					mode: 'shipping',
					allowedCountries: ['VN', 'US'],
					defaultValues: {
						name: cartInfo.name,
					},
				}}
			/>
			<h2 className="font-semibold mt-4 mb-2">Thông tin thanh toán</h2>
			<PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
			<div className="py-4 text-center text-slate-700 text-xl font-bold">
				Tổng cộng: {formatPrice(cartTotalAmount)}
			</div>
			<Button
				label="Thanh toán"
				isLoading={isLoading}
				disabled={isLoading || !stripe || !elements}
				onClick={() => {
					handleNextStep();
					router.push('/cart/orderconfirmation');
				}}
			/>
		</form>
	);
};

export default StripeCheckoutForm;
