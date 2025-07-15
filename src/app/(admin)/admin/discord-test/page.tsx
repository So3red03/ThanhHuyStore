import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';
import TestClient from './TestClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const DiscordTestPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className='pt-8'>
      <TestClient />
    </div>
  );
};

export default DiscordTestPage;
