import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { NextResponse } from 'next/server';

/**
 * POST: Generate all possible variants for a product based on its attributes
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, basePrice, skuPrefix = '' } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product with attributes
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        productType: 'VARIANT',
        isDeleted: false
      },
      include: {
        productAttributes: {
          where: { isVariation: true },
          include: {
            values: {
              where: { isActive: true },
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.productAttributes.length === 0) {
      return NextResponse.json({ error: 'No variation attributes found for this product' }, { status: 400 });
    }

    // Generate all combinations
    const attributeCombinations = generateCombinations(product.productAttributes);

    if (attributeCombinations.length === 0) {
      return NextResponse.json({ error: 'No valid attribute combinations found' }, { status: 400 });
    }

    // Calculate prices and generate SKUs
    const variants = attributeCombinations.map((combination, index) => {
      // Calculate price with adjustments
      let variantPrice = basePrice || product.basePrice || 0;
      let skuParts = [skuPrefix];

      for (const [attrName, value] of Object.entries(combination.attributes)) {
        const attributeValue = value as any; // Type assertion for attribute value
        variantPrice += attributeValue.priceAdjustment || 0;
        skuParts.push(attributeValue.value.toUpperCase());
      }

      const sku = skuParts.filter(Boolean).join('-') || `VAR-${Date.now()}-${index}`;

      return {
        sku,
        attributes: combination.attributeValues,
        price: variantPrice,
        stock: 0, // Default stock
        images: [],
        isActive: true
      };
    });

    // Check for existing SKUs
    const existingSKUs = await prisma.productVariant.findMany({
      where: {
        sku: { in: variants.map(v => v.sku) }
      },
      select: { sku: true }
    });

    const existingSKUSet = new Set(existingSKUs.map(v => v.sku));
    const newVariants = variants.filter(v => !existingSKUSet.has(v.sku));

    if (newVariants.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'All variants already exist',
        data: {
          total: variants.length,
          existing: variants.length,
          created: 0
        }
      });
    }

    // Create variants in transaction
    const createdVariants = await prisma.$transaction(async tx => {
      const results = [];
      for (const variant of newVariants) {
        const created = await tx.productVariant.create({
          data: {
            productId,
            sku: variant.sku,
            attributes: variant.attributes,
            price: variant.price,
            stock: variant.stock,
            thumbnail: null,
            galleryImages: [],
            isActive: variant.isActive
          }
        });
        results.push(created);
      }
      return results;
    });

    return NextResponse.json({
      success: true,
      data: {
        total: variants.length,
        existing: variants.length - newVariants.length,
        created: createdVariants.length,
        variants: createdVariants
      },
      message: `Generated ${createdVariants.length} new variants (${
        variants.length - newVariants.length
      } already existed)`
    });
  } catch (error) {
    console.error('Error generating variants:', error);

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU conflict occurred during generation' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate all possible combinations of attribute values
 */
function generateCombinations(attributes: any[]): any[] {
  if (attributes.length === 0) return [];

  // Filter attributes that have values
  const validAttributes = attributes.filter(attr => attr.values && attr.values.length > 0);

  if (validAttributes.length === 0) return [];

  // Start with the first attribute's values
  let combinations = validAttributes[0].values.map((value: any) => ({
    attributes: { [validAttributes[0].name]: value },
    attributeValues: { [validAttributes[0].name]: value.value }
  }));

  // Add each subsequent attribute
  for (let i = 1; i < validAttributes.length; i++) {
    const attribute = validAttributes[i];
    const newCombinations = [];

    for (const combination of combinations) {
      for (const value of attribute.values) {
        newCombinations.push({
          attributes: {
            ...combination.attributes,
            [attribute.name]: value
          },
          attributeValues: {
            ...combination.attributeValues,
            [attribute.name]: value.value
          }
        });
      }
    }

    combinations = newCombinations;
  }

  return combinations;
}

/**
 * GET: Preview variant combinations without creating them
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
      where: {
        id: productId,
        productType: 'VARIANT',
        isDeleted: false
      },
      include: {
        productAttributes: {
          where: { isVariation: true },
          include: {
            values: {
              where: { isActive: true },
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Generate preview combinations
    const combinations = generateCombinations(product.productAttributes);

    const preview = combinations.map((combination, index) => {
      let variantPrice = basePrice || product.basePrice || 0;

      for (const [attrName, value] of Object.entries(combination.attributes)) {
        const attributeValue = value as any; // Type assertion for attribute value
        variantPrice += attributeValue.priceAdjustment || 0;
      }

      return {
        index: index + 1,
        attributes: combination.attributeValues,
        price: variantPrice,
        priceFormatted: `${variantPrice.toLocaleString()}đ`
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        total: preview.length,
        combinations: preview
      }
    });
  } catch (error) {
    console.error('Error previewing variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
