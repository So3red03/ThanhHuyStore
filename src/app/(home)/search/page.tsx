import { getArticlesBySearchParams } from '@/app/actions/getArticlesBySearchParams';
import SearchResult from './SearchResult';
import { getProductsBySearchParams, IParams } from '@/app/actions/getProductsBySearchParams';

export const dynamic = 'force-dynamic';

interface PageProps {
	searchParams: IParams;
}

export function generateMetadata({ searchParams }: PageProps) {
	const searchTerm = searchParams?.searchTerm || 'tất cả sản phẩm';
	return {
		title: `Kết quả tìm kiếm cho: "${searchTerm}"`
	};
}

const page: React.FC<PageProps> = async ({ searchParams }) => {
	const products = await getProductsBySearchParams(searchParams);
	return <SearchResult products={products} />;
};

export default page;
