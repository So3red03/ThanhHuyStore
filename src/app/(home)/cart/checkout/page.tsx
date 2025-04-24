import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
const Checkout = async () => {
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CheckoutClient currentUser={currentUser} />
		</Suspense>
	);
};

export default Checkout;
