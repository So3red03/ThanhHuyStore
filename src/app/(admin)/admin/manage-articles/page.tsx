import { getArticles } from '@/app/actions/getArticlesData';
import ManageArticlesClient from './ManageArticlesClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { Suspense } from 'react';
import Container from '@/app/components/Container';

// Keep force-dynamic due to analytics tracking
export const dynamic = 'force-dynamic';

const ManageArticles = async () => {
  const articles = await getArticles();
  const currentUser = await getCurrentUser();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container custom='!p-0'>
        <ManageArticlesClient currentUser={currentUser} articleData={articles} />
      </Container>
    </Suspense>
  );
};

export default ManageArticles;
