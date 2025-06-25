import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';
import TestFeaturesClient from './TestFeaturesClient';

const TestFeaturesPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className='pt-8'>
      <TestFeaturesClient currentUser={currentUser} />
    </div>
  );
};

export default TestFeaturesPage;
