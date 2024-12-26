import { ArticleParams, getArticlesBySearchParams } from '@/app/actions/getArticlesBySearchParams';
import SearchResult from './SearchResult';
import axios from 'axios';

export const dynamic = 'force-dynamic';

interface PageProps {
	searchParams: ArticleParams;
}

export const metadata = {
	title: 'Tìm kiếm'
};

const page: React.FC<PageProps> = async ({ searchParams }) => {
	const { data: initialArticles } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/articlePagination/0/4`);
	const articles = await getArticlesBySearchParams(searchParams);
	return <SearchResult initialArticles={initialArticles} articles={articles} />;
};

export default page;
