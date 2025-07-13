'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import { StripeElementsOptions, loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './StripeCheckoutForm';
import { Elements } from '@stripe/react-stripe-js';
import Button from '../../components/Button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

const StripeCheckout = () => {
  const { cartProducts, paymentIntent, handleSetPaymentIntent, cartInfo, shippingFee, selectedVoucher } = useCart();
  const [error, setError] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isPaymentCreated, setIsPaymentCreated] = useState(false);
  const address = cartInfo?.address + ', ' + cartInfo?.ward + ', ' + cartInfo?.district;
  const router = useRouter();
  const clientSecretRef = useRef<string | null>(null);
  useEffect(() => {
    if (cartProducts && !isPaymentCreated) {
      setError(false);

      // fetch('/api/create-payment-intent', {
      // 	method: 'POST',
      // 	headers: { 'Content-Type': 'application/json' },
      // 	body: JSON.stringify({
      // 		items: cartProducts,
      // 		payment_intent_id: paymentIntent,
      // 	}),
      // })
      // 	.then((res) => {
      // 		setLoading(false);
      // 		if (res.status == 401) {
      // 			return router.push('/login');
      // 		}
      // 		if (!res.ok) {
      // 			throw new Error('Network response was not ok');
      // 		}
      // 		return res.json().catch((err) => {
      // 			console.error('Error parsing JSON:', err);
      // 			throw new Error('Invalid JSON');
      // 		});
      // 	})
      // 	.then((data) => {
      // 		if (data) {
      // 			setClientSecret(data.paymentIntent.client_secret);
      // 			handleSetPaymentIntent(data.paymentIntent.id);
      // 		}
      // 	})
      // 	.catch((error) => {
      // 		setError(true);
      // 		toast.error('Something went wrong');
      // 	});

      // Nạp sản phẩm trong giỏ hàng qua checkOutForm
      axios
        .post('/api/orders/create-payment-intent', {
          products: cartProducts,
          payment_intent_id: paymentIntent,
          phoneNumber: cartInfo.phone,
          address: {
            city: cartInfo.city,
            country: 'Việt Nam',
            line1: address,
            postal_code: '00000'
          },
          shippingFee: shippingFee,
          paymentMethod: cartInfo.payment,
          voucher: selectedVoucher
        })
        .then(res => {
          if (res.status == 401) {
            return router.push('/login');
          }
          return res.data;
        })
        .then(data => {
          if (data) {
            setIsPaymentCreated(true);
            clientSecretRef.current = data.paymentIntent.client_secret;
            handleSetPaymentIntent(data.paymentIntent.id);
            setClientSecret(data.paymentIntent.client_secret);
          }
        })
        .catch(error => {
          setError(true);
          toast.error('Something went wrong');
        });
    }
  }, []);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      labels: 'floating'
    }
  };

  const handleSetPaymentSuccess = useCallback((value: boolean) => {
    setPaymentSuccess(value);
  }, []);

  return (
    <div className='w-full'>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm clientSecret={clientSecret} handleSetPaymentSuccess={handleSetPaymentSuccess} />
        </Elements>
      )}
      {error && <div className='text-center text-rose-500'>Lỗiiiii...</div>}
    </div>
  );
};

export default StripeCheckout;
