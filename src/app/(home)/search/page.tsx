import { getArticlesBySearchParams } from '@/app/actions/getArticlesBySearchParams';
import SearchResult from './SearchResult';
import { getProductsBySearchParams, IParams } from '@/app/actions/getProductsBySearchParams';

// Optimized caching: Search results can be cached briefly to reduce database load
export const revalidate = 1800; // 30 minutes

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
  const articles = await getArticlesBySearchParams(searchParams);
  return <SearchResult products={products} articles={articles} />;
};

export default page;
