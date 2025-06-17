import { getArticles } from '@/app/actions/getArticlesData';
import DisplayArticles from './DisplayArticles';
import { getArticleListBySlug } from '@/app/actions/getArticleListBySlug';

// Keep force-dynamic due to analytics tracking
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tất cả bài viết - ThanhHuy Store'
};

const news = async () => {
  // Use direct database action instead of axios to avoid dynamic server usage
  const initialArticles = await getArticles();
  const slug = 'thu-thuat-hoi-dap';
  const articlesRightSide = await getArticleListBySlug({ slug });
  return <DisplayArticles initialArticles={initialArticles} ArticlesListRightSide={articlesRightSide} />;
};

export default news;
