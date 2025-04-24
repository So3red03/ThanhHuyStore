import Container from '@/app/components/Container';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { Suspense } from 'react';
import ManageBannerClient from './ManageBannerClient';
import { getBanner } from '@/app/actions/getBannerData';

export const dynamic = 'force-dynamic';

const ManageBanner = async () => {
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
