import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrders } from '@/app/actions/getOrders';
import { getSessionUsers, getUsers } from '@/app/actions/getUsers';
import { getTotalRevenue } from '@/app/actions/getTotalRevenue';
import getColumnChartData from '@/app/actions/getColumnChartData';
import { Suspense } from 'react';
import { getConversations } from '@/app/actions/getConversations';
import { getReviews } from '@/app/actions/getReviews';
import { getProducts } from '@/app/actions/getProducts';
import DashboardTabs from '@/app/components/admin/dashboard/DashboardTabs';
import OverviewTab from '@/app/components/admin/dashboard/OverviewTab';
import AnalyticsTab from '@/app/components/admin/dashboard/AnalyticsTab';
import ReportsTab from '@/app/components/admin/dashboard/ReportsTab';
import AuditTab from '@/app/components/admin/dashboard/AuditTab';
import NoSSR from '@/app/components/NoSSR';

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
  const products = await getProducts({ category: null }); // Get all products for consistent data

  // Calculate average order value from completed orders (excluding returned orders)
  const completedOrders =
    orders?.filter(order => {
      // Only include completed orders
      if (order.status !== 'completed') return false;

      // Exclude orders with approved/completed return requests
      if (order.returnRequests && order.returnRequests.length > 0) {
        const hasActiveReturn = order.returnRequests.some(
          (returnReq: any) => returnReq.status === 'APPROVED' || returnReq.status === 'COMPLETED'
        );
        if (hasActiveReturn) {
          console.log(`🔄 [AVG-ORDER] Excluding order ${order.id} from average calculation due to return request`);
          return false;
        }
      }

      return true;
    }) || [];

  const avgOrderValue =
    completedOrders.length > 0
      ? completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0) / completedOrders.length
      : 0;

  console.log(`📊 [AVG-ORDER] Average order value: ${avgOrderValue} (from ${completedOrders.length} valid orders)`);

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <NoSSR
        fallback={
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        }
      >
        <DashboardTabs
          overviewContent={
            <OverviewTab
              orders={orders}
              users={users}
              totalRevenue={totalRevenue}
              currentUser={currentUser}
              reviews={reviews}
              conversations={conversations}
              userInSession={userInSession}
              salesWeeklyData={columnChartData}
              avgOrderValue={avgOrderValue}
            />
          }
          analyticsContent={<AnalyticsTab />}
          reportsContent={<ReportsTab orders={orders} users={users} totalRevenue={totalRevenue} products={products} />}
          notificationsContent={<AuditTab orders={orders} users={users} />}
          orders={orders}
          users={users}
        />
      </NoSSR>
    </Suspense>
  );
};

export default AdminDashboard;
