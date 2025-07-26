import { getProductsByCategory } from '@/app/actions/getProducts';
import DisplayProducts from '../DisplayProducts';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export default async function SubItemPage({ params }: { params: { category: string; subCategory: string } }) {
  const { category, subCategory } = params;

  // Validate subCategory slug - reject MongoDB IDs and invalid patterns
  if (
    !subCategory ||
    subCategory.includes('.') ||
    subCategory.includes('placeholder') ||
    subCategory.length < 2 ||
    /^[0-9a-f]{24}$/.test(subCategory) || // MongoDB ObjectId pattern
    /^[0-9]+$/.test(subCategory) // Pure numbers
  ) {
    notFound();
  }

  try {
    const products = await getProductsByCategory(subCategory);
    return <DisplayProducts products={products} />;
  } catch (error) {
    console.error('Error loading subcategory:', error);
    notFound();
  }
}
