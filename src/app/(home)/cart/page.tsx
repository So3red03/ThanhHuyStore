import { getCurrentUser } from '@/app/actions/getCurrentUser';
import CartBuyClient from './CartBuyClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const Cart = async () => {
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CartBuyClient currentUser={currentUser} />
		</Suspense>
	);
};

export default Cart;
