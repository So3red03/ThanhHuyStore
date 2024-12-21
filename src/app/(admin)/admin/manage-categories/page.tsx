// import Container from '@/app/components/Container';
// import ManageCategoriesClient from './ManageCategoriesClient';
// import { getCurrentUser } from '@/app/actions/getCurrentUser';

// export const dynamic = 'force-dynamic';

// const ManageCategories = async () => {
// 	const currentUser = await getCurrentUser();
// 	return (
// 		<Container custom="!p-0">
// 			{/* <ManageCategoriesClient currentUser={currentUser} categories={categories} /> */}
// 			<ManageCategoriesClient />
// 		</Container>
// 	);
// };

// export default ManageCategories;

import Container from '@/app/components/Container';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrders } from '@/app/actions/getOrders';
import { Suspense } from 'react';
import { getBanner } from '@/app/actions/getBannerData';
import ManageBannerClient from '../manage-banner/ManageBannerClient';

export const dynamic = 'force-dynamic';

const ManageBanner = async () => {
	const orders = await getOrders();
	const currentUser = await getCurrentUser();
	const bannerData = await getBanner();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Container custom="!p-0">
				<ManageBannerClient currentUser={currentUser} bannerData={bannerData} />
			</Container>
		</Suspense>
	);
};

export default ManageBanner;
