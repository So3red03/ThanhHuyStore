import NotFound from '../../404';
import ArticleList from './ArticleList';
import { getArticleListBySlug, IParams } from '@/app/actions/getArticleListBySlug';

const CategoryArticlePage = async ({ params }: { params: IParams }) => {
	const slug = params.slug;
	if (!slug) {
		return <NotFound />;
	}
	const articles = await getArticleListBySlug({ slug });
	return <ArticleList articles={articles} />;
};

export default CategoryArticlePage;
