import Container from '@/app/components/Container';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { Suspense } from 'react';
import ManageBannerClient from './ManageBannerClient';
import { getBanner } from '@/app/actions/getBannerData';

// Keep force-dynamic due to analytics tracking
export const dynamic = 'force-dynamic';

const ManageBanner = async () => {
  const currentUser = await getCurrentUser();
  const bannerData = await getBanner();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container custom='!p-0'>
        <ManageBannerClient currentUser={currentUser} bannerData={bannerData} />
      </Container>
    </Suspense>
  );
};

export default ManageBanner;
