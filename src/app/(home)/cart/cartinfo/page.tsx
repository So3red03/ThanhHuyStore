import { Suspense } from 'react';
import CartInfoClient from './CartInfoClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
const CartInfo = async () => {
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CartInfoClient currentUser={currentUser} />
		</Suspense>
	);
};

export default CartInfo;
