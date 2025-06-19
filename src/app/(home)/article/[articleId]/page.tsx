import { Suspense } from 'react';
import ArticleDetails from './ArticleDetails';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import NotFound from '../../404';
import axios from 'axios';
import { getArticleListBySlug } from '@/app/actions/getArticleListBySlug';
import RelatedArticles from '@/app/components/news/RelatedArticles';
import { getAllProducts } from '@/app/actions/getAllProducts';
import RecentlyViewedProducts from '@/app/components/RecentlyViewedProducts';

export const dynamic = 'force-dynamic';

interface IParams {
  articleId: string;
}

// Hàm để lấy metadata từ dữ liệu đã fetch
export async function generateMetadata({ params }: { params: IParams }) {
  const articleId = params.articleId.split('-').pop(); // Lấy phần ID từ cuối chuỗi

  if (!articleId) {
    throw new Error('Bài viết không tìm thấy');
  }

  const { data: article } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/article/${articleId}`);

  return {
    title: article?.title
  };
}

const Article = async ({ params }: { params: IParams }) => {
  const articleId = params.articleId.split('-').pop(); // lấy phần ID từ cuối chuỗi

  if (!articleId) {
    return <NotFound />;
  }

  const { data: article } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/article/${articleId}`);
  const currentUser = await getCurrentUser();
  const slug = article.category.slug;
  const relatedArticles = await getArticleListBySlug({ slug });
  const allProducts = await getAllProducts();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <div className='max-w-full mx-auto h-full px-2 lg:px-0 relative w-full'>
        <ArticleDetails article={article} allProducts={allProducts} currentUser={currentUser} />
        <RelatedArticles article={article} articleList={relatedArticles} />
      </div>
    </Suspense>
  );
};

export default Article;
