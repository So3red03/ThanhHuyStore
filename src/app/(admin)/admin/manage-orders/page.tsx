import Container from '@/app/components/Container';
import ManageOrdersClient from './ManageOrdersClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrders } from '@/app/actions/getOrders';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const ManageOrders = async () => {
	const orders = await getOrders();
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Container custom="!p-0">
				<ManageOrdersClient orders={orders} currentUser={currentUser} />
			</Container>
		</Suspense>
	);
};

export default ManageOrders;
