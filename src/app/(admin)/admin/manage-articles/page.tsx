import { getArticles } from '@/app/actions/getArticlesData';
import ManageArticlesClient from './ManageArticlesClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { Suspense } from 'react';
import Container from '@/app/components/Container';

export const dynamic = 'force-dynamic';

const ManageArticles = async () => {
	const articles = await getArticles();
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Container custom="!p-0">
				<ManageArticlesClient currentUser={currentUser} articleData={articles} />
			</Container>
		</Suspense>
	);
};

export default ManageArticles;
