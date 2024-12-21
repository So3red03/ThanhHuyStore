import Container from '@/app/components/Container';
import ManageProductsClient from './ManageProductsClient';
import { getProducts } from '@/app/actions/getProducts';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const ManageProducts = async () => {
	const products = await getProducts({ category: null });
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Container custom="!p-0">
				<ManageProductsClient products={products} currentUser={currentUser} />
			</Container>
		</Suspense>
	);
};

export default ManageProducts;
