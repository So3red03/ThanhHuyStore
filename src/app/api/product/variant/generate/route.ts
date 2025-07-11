import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../../libs/prismadb';
import { NextResponse } from 'next/server';

/**
 * POST: Generate variants from product attributes
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, basePrice = 0, skuPrefix = '' } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product with attributes
    const product = await prisma.product.findUnique({
      where: { id: productId, productType: 'VARIANT' },
      include: {
        productAttributes: {
          include: {
            values: {
              orderBy: { position: 'asc' }
            }
          },
          where: { isVariation: true },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Variant product not found' }, { status: 404 });
    }

    if (product.productAttributes.length === 0) {
      return NextResponse.json({ error: 'No variation attributes found' }, { status: 400 });
    }

    // Generate all possible combinations
    const attributeCombinations = generateAttributeCombinations(product.productAttributes);

    if (attributeCombinations.length === 0) {
      return NextResponse.json({ error: 'No valid combinations found' }, { status: 400 });
    }

    // Calculate prices and generate SKUs
    const variants = attributeCombinations.map((combination, index) => {
      // Calculate price with adjustments
      let variantPrice = basePrice || 0;

      // Add price adjustments from attribute values
      combination.forEach(attr => {
        const attributeValue = product.productAttributes
          .find(pa => pa.id === attr.attributeId)?.values
          .find(v => v.id === attr.valueId);
        
        if (attributeValue?.priceAdjustment) {
          variantPrice += attributeValue.priceAdjustment;
        }
      });

      // Generate SKU
      const skuParts = combination.map(attr => {
        const attributeValue = product.productAttributes
          .find(pa => pa.id === attr.attributeId)?.values
          .find(v => v.id === attr.valueId);
        return attributeValue?.value.toUpperCase().replace(/\s+/g, '-') || '';
      });

      const sku = skuPrefix ? `${skuPrefix}-${skuParts.join('-')}` : `SKU-${skuParts.join('-')}`;

      // Create attributes object for variant
      const attributes: Record<string, string> = {};
      combination.forEach(attr => {
        const productAttr = product.productAttributes.find(pa => pa.id === attr.attributeId);
        const attributeValue = productAttr?.values.find(v => v.id === attr.valueId);
        
        if (productAttr && attributeValue) {
          const attrKey = productAttr.name.toLowerCase().replace(/\s+/g, '-');
          attributes[attrKey] = attributeValue.value;
        }
      });

      return {
        sku,
        attributes,
        price: Math.max(variantPrice, 0), // Ensure price is not negative
        stock: 0, // Default stock
        thumbnail: null,
        galleryImages: []
      };
    });

    // Create variants in database
    const createdVariants = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const variant of variants) {
        // Check if SKU already exists
        const existingSku = await tx.productVariant.findFirst({
          where: { sku: variant.sku }
        });

        if (!existingSku) {
          const created = await tx.productVariant.create({
            data: {
              productId,
              sku: variant.sku,
              attributes: variant.attributes,
              price: variant.price,
              stock: variant.stock,
              thumbnail: variant.thumbnail,
              galleryImages: variant.galleryImages
            }
          });
          results.push(created);
        }
      }

      return results;
    });

    return NextResponse.json({
      message: `Generated ${createdVariants.length} variants`,
      variants: createdVariants,
      skipped: variants.length - createdVariants.length
    });
  } catch (error) {
    console.error('Error generating variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET: Preview variants without creating them
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const basePrice = parseFloat(searchParams.get('basePrice') || '0');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product with attributes
    const product = await prisma.product.findUnique({
      where: { id: productId, productType: 'VARIANT' },
      include: {
        productAttributes: {
          include: {
            values: {
              orderBy: { position: 'asc' }
            }
          },
          where: { isVariation: true },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Variant product not found' }, { status: 404 });
    }

    // Generate combinations for preview
    const combinations = generateAttributeCombinations(product.productAttributes);

    const preview = combinations.map((combination, index) => {
      let variantPrice = basePrice || 0;

      // Add price adjustments
      combination.forEach(attr => {
        const attributeValue = product.productAttributes
          .find(pa => pa.id === attr.attributeId)?.values
          .find(v => v.id === attr.valueId);
        
        if (attributeValue?.priceAdjustment) {
          variantPrice += attributeValue.priceAdjustment;
        }
      });

      // Generate preview SKU
      const skuParts = combination.map(attr => {
        const attributeValue = product.productAttributes
          .find(pa => pa.id === attr.attributeId)?.values
          .find(v => v.id === attr.valueId);
        return attributeValue?.value.toUpperCase().replace(/\s+/g, '-') || '';
      });

      const sku = `SKU-${skuParts.join('-')}`;

      // Create attributes object
      const attributes: Record<string, string> = {};
      combination.forEach(attr => {
        const productAttr = product.productAttributes.find(pa => pa.id === attr.attributeId);
        const attributeValue = productAttr?.values.find(v => v.id === attr.valueId);
        
        if (productAttr && attributeValue) {
          const attrKey = productAttr.name.toLowerCase().replace(/\s+/g, '-');
          attributes[attrKey] = attributeValue.value;
        }
      });

      return {
        sku,
        attributes,
        price: Math.max(variantPrice, 0),
        combination: combination.map(attr => {
          const productAttr = product.productAttributes.find(pa => pa.id === attr.attributeId);
          const attributeValue = productAttr?.values.find(v => v.id === attr.valueId);
          return {
            attribute: productAttr?.name,
            value: attributeValue?.value,
            priceAdjustment: attributeValue?.priceAdjustment || 0
          };
        })
      };
    });

    return NextResponse.json({
      productName: product.name,
      totalCombinations: preview.length,
      preview
    });
  } catch (error) {
    console.error('Error previewing variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper function to generate all attribute combinations
 */
function generateAttributeCombinations(attributes: any[]): Array<{ attributeId: string; valueId: string }[]> {
  if (attributes.length === 0) return [];

  const combinations: Array<{ attributeId: string; valueId: string }[]> = [];

  function generateCombination(attrIndex: number, currentCombination: { attributeId: string; valueId: string }[]) {
    if (attrIndex >= attributes.length) {
      combinations.push([...currentCombination]);
      return;
    }

    const currentAttribute = attributes[attrIndex];
    for (const value of currentAttribute.values) {
      currentCombination.push({
        attributeId: currentAttribute.id,
        valueId: value.id
      });
      generateCombination(attrIndex + 1, currentCombination);
      currentCombination.pop();
    }
  }

  generateCombination(0, []);
  return combinations;
}
