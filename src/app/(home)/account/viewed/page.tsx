import { Suspense } from 'react';
import UserViewedClient from './UserViewedClient';
import { getProducts } from '@/app/actions/getProducts';
export const dynamic = 'force-dynamic';

const Viewed = async () => {
	const products = await getProducts({ category: null });
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<UserViewedClient productsViewed={products} />
		</Suspense>
	);
};

export default Viewed;
