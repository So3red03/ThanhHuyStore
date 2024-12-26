import { Suspense } from 'react';
import UserViewedClient from './UserViewedClient';
import { getProducts } from '@/app/actions/getProducts';
export const dynamic = 'force-dynamic';

const Viewed = async () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<UserViewedClient />
		</Suspense>
	);
};

export default Viewed;
