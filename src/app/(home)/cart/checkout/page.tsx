import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';
export const dynamic = 'force-dynamic';
const Checkout = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CheckoutClient />
		</Suspense>
	);
};

export default Checkout;
