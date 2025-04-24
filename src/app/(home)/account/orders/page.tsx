import { Suspense } from 'react';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import OrdersClient from './OrdersClient';
import { getOrdersById } from '@/app/actions/getOrdersById';
import NullData from '@/app/components/NullData';

export const dynamic = 'force-dynamic';

const Orders = async () => {
	const currentUser = await getCurrentUser();
	if (!currentUser) {
		return <NullData title="Bạn chưa đăng nhập" />;
	}
	const orders = await getOrdersById(currentUser?.id);

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<OrdersClient orders={orders} currentUser={currentUser} />
		</Suspense>
	);
};

export default Orders;
