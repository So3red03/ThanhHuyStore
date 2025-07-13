import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrders } from '@/app/actions/getOrders';
import { getSessionUsers, getUsers } from '@/app/actions/getUsers';
import { getTotalRevenue } from '@/app/actions/getTotalRevenue';
import getColumnChartData from '@/app/actions/getColumnChartData';
import { Suspense } from 'react';
import { getConversations } from '@/app/actions/getConversations';
import { getReviews } from '@/app/actions/getReviews';
import DashboardTabs from '@/app/components/admin/DashboardTabs';
import OverviewTab from '@/app/components/admin/dashboard/OverviewTab';
import AnalyticsTab from '@/app/components/admin/dashboard/AnalyticsTab';
import ReportsTab from '@/app/components/admin/dashboard/ReportsTab';
import AuditTab from '@/app/components/admin/dashboard/AuditTab';

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
    <Suspense
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
          />
        }
        analyticsContent={<AnalyticsTab />}
        reportsContent={<ReportsTab orders={orders} users={users} totalRevenue={totalRevenue} />}
        notificationsContent={<AuditTab orders={orders} users={users} />}
      />
    </Suspense>
  );
};

export default AdminDashboard;
