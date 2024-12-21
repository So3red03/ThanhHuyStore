import { ArticleParams, getArticlesBySearchParams } from '@/app/actions/getArticlesBySearchParams';
import SearchResult from './SearchResult';

export const dynamic = 'force-dynamic';

interface PageProps {
	searchParams: ArticleParams;
}

export const metadata = {
	title: 'Tìm kiếm'
};

const page: React.FC<PageProps> = async ({ searchParams }) => {
	const articles = await getArticlesBySearchParams(searchParams);
	return <SearchResult articles={articles} />;
};

export default page;
