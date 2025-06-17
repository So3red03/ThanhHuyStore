import { getArticles } from '../actions/getArticlesData';
import { getBanner } from '../actions/getBannerData';
import { getParentCategoryAndProductsBySlug } from '../actions/getProducts';
import { getAllProducts } from '../actions/getAllProducts';
import { getCurrentUser } from '../actions/getCurrentUser';
import Container from '../components/Container';
import DisplayCategory from '../components/DisplayCategory';
import DisplayNews from '../components/DisplayNews';
import { HomeBanner } from '../components/HomeBanner';
import DisplayProductsBySlug from '../components/products/DisplayProductsBySlug';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';

// Keep force-dynamic due to analytics tracking and complex dynamic usage
export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const bannerData = await getBanner();
    const articles = await getArticles();
    const currentUser = await getCurrentUser();
    const allProducts = await getAllProducts();
    const iphone = await getParentCategoryAndProductsBySlug('iphone');
    const mac = await getParentCategoryAndProductsBySlug('mac');
    const ipad = await getParentCategoryAndProductsBySlug('ipad');
    const airpods = await getParentCategoryAndProductsBySlug('airpods');
    const watch = await getParentCategoryAndProductsBySlug('watch');
    const phukien = await getParentCategoryAndProductsBySlug('phu-kien');

    return (
      <main>
        <div className='w-full'>
          <HomeBanner bannerData={bannerData || []} />
        </div>
        <div>
          <DisplayCategory />
        </div>
        <PersonalizedRecommendations allProducts={allProducts || []} currentUser={currentUser} />
        {iphone && (
          <Container>
            <div className='xl:px-[50px]'>
              <DisplayProductsBySlug data={iphone} />
            </div>
          </Container>
        )}
        {mac && (
          <Container>
            <div className='xl:px-[50px]'>
              <DisplayProductsBySlug data={mac} />
            </div>
          </Container>
        )}
        {ipad && (
          <Container>
            <div className='xl:px-[50px]'>
              <DisplayProductsBySlug data={ipad} />
            </div>
          </Container>
        )}
        {airpods && (
          <Container>
            <div className='xl:px-[50px]'>
              <DisplayProductsBySlug data={airpods} />
            </div>
          </Container>
        )}
        {watch && (
          <Container>
            <div className='xl:px-[50px]'>
              <DisplayProductsBySlug data={watch} />
            </div>
          </Container>
        )}
        {phukien && (
          <Container>
            <div className='xl:px-[100px]'>
              <DisplayProductsBySlug data={phukien} />
            </div>
          </Container>
        )}
        <div className='max-w-[1280px] mx-auto flex flex-col lg:flex-row pb-10 lg:mt-5 mt-2 relative'>
          <DisplayNews articles={articles || []} />
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading home page:', error);
    return (
      <main>
        <div className='w-full'>
          <div className='text-center py-20'>
            <h1 className='text-2xl font-bold text-gray-800 mb-4'>Đang cập nhật dữ liệu...</h1>
            <p className='text-gray-600'>Vui lòng thử lại sau ít phút.</p>
          </div>
        </div>
      </main>
    );
  }
}
