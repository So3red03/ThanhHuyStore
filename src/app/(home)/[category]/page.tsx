import { getParentCategoryAndProductsBySlug } from '@/app/actions/getProducts';
import DisplayProducts from './DisplayProducts';
import Banner from './Banner';
export const dynamic = 'force-dynamic';
export default async function SubItemPage({ params }: { params: { category: string } }) {
	const { category } = params;
	const products = await getParentCategoryAndProductsBySlug(category);
	return (
		<>
			<Banner/>
			<DisplayProducts products={products?.products} />;
		</>
	)
}
