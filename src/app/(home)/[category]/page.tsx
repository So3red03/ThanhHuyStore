import { getParentCategoryAndProductsBySlug } from '@/app/actions/getProducts';
import DisplayProducts from './DisplayProducts';
import Banner from './Banner';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SubItemPage({ params }: { params: { category: string } }) {
  const { category } = params;

  // Validate category slug - reject file extensions and invalid patterns
  if (
    !category ||
    category.includes('.') ||
    category.includes('placeholder') ||
    category.length < 2 ||
    /^[0-9]+$/.test(category)
  ) {
    notFound();
  }

  try {
    const products = await getParentCategoryAndProductsBySlug(category);
    return (
      <>
        <Banner />
        <DisplayProducts products={products?.products} />
      </>
    );
  } catch (error) {
    console.error('Error loading category:', error);
    notFound();
  }
}
