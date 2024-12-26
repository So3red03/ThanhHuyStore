import { getProductsByCategory } from '@/app/actions/getProducts';
import DisplayProducts from '../DisplayProducts';

export const dynamic = 'force-dynamic';
export default async function SubItemPage({ params }: { params: { category: string; subCategory: string } }) {
	const { category, subCategory } = params;
	const products = await getProductsByCategory(subCategory);
	return <DisplayProducts products={products} />;
}
