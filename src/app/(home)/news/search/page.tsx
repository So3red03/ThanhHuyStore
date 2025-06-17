import { ArticleParams, getArticlesBySearchParams } from '@/app/actions/getArticlesBySearchParams';
import SearchResult from './SearchResult';
import { getArticles } from '@/app/actions/getArticlesData';

// Keep force-dynamic due to searchParams usage
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: ArticleParams;
}

export const metadata = {
  title: 'Tìm kiếm'
};

const page: React.FC<PageProps> = async ({ searchParams }) => {
  // Use direct database action instead of axios to avoid dynamic server usage
  const initialArticles = await getArticles();
  const articles = await getArticlesBySearchParams(searchParams);
  return <SearchResult initialArticles={initialArticles} articles={articles} />;
};

export default page;
