import { Suspense } from 'react';
import OrderConfirmationClient from './OrderConfirmationClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrderByPaymentId } from '@/app/actions/getOrderByPaymentId';
import { useCart } from '@/app/hooks/useCart';

export const dynamic = 'force-dynamic';
const OrderConfirmation = async () => {
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<OrderConfirmationClient currentUser={currentUser} />
		</Suspense>
	);
};

export default OrderConfirmation;
