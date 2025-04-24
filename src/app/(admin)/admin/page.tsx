import { getCurrentUser } from '@/app/actions/getCurrentUser';
import AdminDashBoardForm from './AdminDasboardForm';
import { getOrders } from '@/app/actions/getOrders';
import { getSessionUsers, getUsers } from '@/app/actions/getUsers';
import { getTotalRevenue } from '@/app/actions/getTotalRevenue';
import getColumnChartData from '@/app/actions/getColumnChartData';
import { Suspense } from 'react';
import { getConversations } from '@/app/actions/getConversations';
import { getReviews } from '@/app/actions/getReviews';

export const dynamic = 'force-dynamic';

const AdminDashboard = async () => {
	const currentUser = await getCurrentUser();
	const orders = await getOrders();
	const reviews = await getReviews();
	const users = await getUsers();
	const totalRevenue = await getTotalRevenue();
	const columnChartData = await getColumnChartData();
	const userInSession = await getSessionUsers();
	const conversations = await getConversations();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AdminDashBoardForm
				orders={orders}
				users={users}
				totalRevenue={totalRevenue}
				columnData={columnChartData}
				currentUser={currentUser}
				reviews={reviews}
				userInSession={userInSession}
				conversations={conversations}
			/>
		</Suspense>
	);
};

export default AdminDashboard;
