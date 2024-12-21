// import { getCurrentUser } from '@/app/actions/getCurrentUser';
// import { Suspense } from 'react';
// import Container from '@/app/components/Container';
// import ManageCategoriesClient from './ManageCategoriesClient';
// import { getArticlesCategory } from '@/app/actions/getArticlesCategory';

// export const dynamic = 'force-dynamic';

// const ManageCategories = async () => {
// 	const currentUser = await getCurrentUser();
// 	const categoriesData = await getArticlesCategory();
// 	return (
// 		<Suspense fallback={<div>Loading...</div>}>
// 			<Container custom="!p-0">
// 				<ManageCategoriesClient currentUser={currentUser} categoriesData={categoriesData} />
// 			</Container>
// 		</Suspense>
// 	);
// };

// export default ManageCategories;

import Container from '@/app/components/Container';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrders } from '@/app/actions/getOrders';
import { Suspense } from 'react';
import { getBanner } from '@/app/actions/getBannerData';
import ManageCategoriesClient from '../manage-categories/ManageCategoriesClient';
import ManageArticlesCategoriesClient from './ManageArticlesCategoriesClient';
import { getArticlesCategory } from '@/app/actions/getArticlesCategory';

export const dynamic = 'force-dynamic';

const ManageBanner = async () => {
	const articleCategory = await getArticlesCategory();
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Container custom="!p-0">
				<ManageArticlesCategoriesClient categoriesData={articleCategory} currentUser={currentUser} />
			</Container>
		</Suspense>
	);
};

export default ManageBanner;
