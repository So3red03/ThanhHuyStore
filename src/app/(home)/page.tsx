import { getArticles } from '../actions/getArticlesData';
import { getBanner } from '../actions/getBannerData';
import { getParentCategoryAndProductsBySlug } from '../actions/getProducts';
import Container from '../components/Container';
import DisplayCategory from '../components/DisplayCategory';
import DisplayNews from '../components/DisplayNews';
import { HomeBanner } from '../components/HomeBanner';
import DisplayProductsBySlug from '../components/products/DisplayProductsBySlug';

export const dynamic = 'force-dynamic';

export default async function Home() {
	const bannerData = await getBanner();
	const articles = await getArticles();
	const iphone = await getParentCategoryAndProductsBySlug('iphone');
	const mac = await getParentCategoryAndProductsBySlug('mac');
	const ipad = await getParentCategoryAndProductsBySlug('ipad');
	const airpods = await getParentCategoryAndProductsBySlug('airpods');
	const watch = await getParentCategoryAndProductsBySlug('watch');
	const phukien = await getParentCategoryAndProductsBySlug('phu-kien');

	return (
		<main>
			<div className="w-full">
				<HomeBanner bannerData={bannerData} />
			</div>
			<div>
				<DisplayCategory />
			</div>
			<Container>
				<div className="xl:px-[50px]">
					<DisplayProductsBySlug data={iphone} />
				</div>
			</Container>
			<Container>
				<div className="xl:px-[50px]">
					<DisplayProductsBySlug data={mac} />
				</div>
			</Container>
			<Container>
				<div className="xl:px-[50px]">
					<DisplayProductsBySlug data={ipad} />
				</div>
			</Container>
			<Container>
				<div className="xl:px-[50px]">
					<DisplayProductsBySlug data={airpods} />
				</div>
			</Container>
			<Container>
				<div className="xl:px-[50px]">
					<DisplayProductsBySlug data={watch} />
				</div>
			</Container>
			<Container>
				<div className="xl:px-[100px]">
					<DisplayProductsBySlug data={phukien} />
				</div>
			</Container>
			<div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row pb-10 lg:mt-5 mt-2 relative">
				<DisplayNews articles={articles} />
			</div>
		</main>
	);
	
		
}
