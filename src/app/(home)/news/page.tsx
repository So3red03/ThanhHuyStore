import { getArticles } from '@/app/actions/getArticlesData';
import DisplayArticles from './DisplayArticles';
import axios from 'axios';
import { getArticleListBySlug } from '@/app/actions/getArticleListBySlug';

// Optimized caching: News articles update frequently, cache for 30 minutes
export const revalidate = 1800; // 30 minutes

export const metadata = {
  title: 'Tất cả bài viết - ThanhHuy Store'
};

const news = async () => {
  const { data: initialArticles } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/articlePagination/0/6`);
  const slug = 'thu-thuat-hoi-dap';
  const articlesRightSide = await getArticleListBySlug({ slug });
  return <DisplayArticles initialArticles={initialArticles} ArticlesListRightSide={articlesRightSide} />;
};

export default news;
