import { getArticles } from '../actions/getArticlesData';
import { getBanner } from '../actions/getBannerData';
import { getProducts, IProductParams } from '../actions/getProducts';
import Container from '../components/Container';
import DisplayCategory from '../components/DisplayCategory';
import DisplayNews from '../components/DisplayNews';
import { HomeBanner } from '../components/HomeBanner';
import DisplayProducts from './DisplayProducts';

export const dynamic = 'force-dynamic';

interface HomeProps {
	searchParams: IProductParams;
}

export default async function Home({ searchParams }: HomeProps) {
	const hotProducts = await getProducts(searchParams);
	const bannerData = await getBanner();
	const articles = await getArticles();
	return (
		<main>
			<div className="w-full">
				<HomeBanner bannerData={bannerData} />
			</div>
			<div>
				<DisplayCategory />
			</div>
			<Container>
				<div className="xl:px-[100px]">
					<DisplayProducts data={hotProducts} />
				</div>
			</Container>
			<div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row pb-10 lg:mt-5 mt-2 relative">
				<DisplayNews articles={articles} />
			</div>
		</main>
	);
}
