import Container from '@/app/components/Container';
import ManageStaffClient from './ManageStaffClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getStaffUsers } from '@/app/actions/getStaffUsers';
import { Suspense } from 'react';
import { hasPermission } from '@/app/utils/admin/permissionUtils';
import { PERMISSIONS } from '@/app/utils/admin/permissions';
import { redirect } from 'next/navigation';

// Keep force-dynamic due to analytics tracking
export const dynamic = 'force-dynamic';

const ManageStaff = async () => {
  const currentUser = await getCurrentUser();

  // Check if user has permission to view staff
  if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.STAFF_VIEW)) {
    redirect('/admin');
  }

  const staffUsers = await getStaffUsers();

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container custom='!p-0'>
        <ManageStaffClient staffUsers={staffUsers} currentUser={currentUser} />
      </Container>
    </Suspense>
  );
};

export default ManageStaff;
