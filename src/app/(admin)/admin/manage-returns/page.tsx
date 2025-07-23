import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';
import ManageReturnsClient from './ManageReturnsClient';

const ManageReturnsPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
    redirect('/');
  }

  return (
    <div className="p-8">
      <ManageReturnsClient currentUser={currentUser} />
    </div>
  );
};

export default ManageReturnsPage;
