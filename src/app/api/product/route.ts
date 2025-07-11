import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Invoking data JSON from request
  const body = await request.json();
  const { name, description, price, categoryId, inStock, images, productType, variations, attributes } = body;

  // Detailed validation with specific error messages
  const missingFields = [];

  // Common required fields for all product types
  if (!name || name.trim() === '') missingFields.push('name (tên sản phẩm)');
  if (!description || description.trim() === '') missingFields.push('description (mô tả)');
  if (!categoryId || categoryId.trim() === '') missingFields.push('categoryId (danh mục)');

  // Validation: Check if categoryId is valid ObjectId format
  if (categoryId && categoryId.length !== 24) {
    return NextResponse.json(
      {
        error: 'categoryId không hợp lệ. Vui lòng chọn danh mục.',
        receivedCategoryId: categoryId
      },
      { status: 400 }
    );
  }

  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', { name, description, categoryId, missingFields });
    return NextResponse.json(
      {
        error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`,
        missingFields,
        receivedData: { name, description, categoryId, productType }
      },
      { status: 400 }
    );
  }

  // Different validation for Simple vs Variant products
  if (productType === 'SIMPLE') {
    const simpleProductErrors = [];

    if (!price || price <= 0) {
      simpleProductErrors.push('price (giá sản phẩm > 0)');
    }
    if (inStock === undefined || inStock === null || inStock < 0) {
      simpleProductErrors.push('inStock (số lượng tồn kho >= 0)');
    }

    if (simpleProductErrors.length > 0) {
      console.error('❌ Simple product validation errors:', { price, inStock, simpleProductErrors });
      return NextResponse.json(
        {
          error: `Sản phẩm đơn thiếu: ${simpleProductErrors.join(', ')}`,
          missingFields: simpleProductErrors,
          receivedData: { price, inStock }
        },
        { status: 400 }
      );
    }
  } else if (productType === 'VARIANT') {
    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      console.error('❌ Variant product missing variations:', { variations });
      return NextResponse.json(
        {
          error: 'Sản phẩm biến thể cần có ít nhất một biến thể',
          receivedVariations: variations
        },
        { status: 400 }
      );
    }

    // Validate each variation
    const variantErrors = [];
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      if (!variation.price || variation.price <= 0) {
        variantErrors.push(`Biến thể ${i + 1}: thiếu giá hợp lệ (> 0)`);
      }
      if (variation.stock === undefined || variation.stock === null || variation.stock < 0) {
        variantErrors.push(`Biến thể ${i + 1}: thiếu số lượng hợp lệ (>= 0)`);
      }
    }

    if (variantErrors.length > 0) {
      console.error('❌ Variant validation errors:', { variantErrors });
      return NextResponse.json(
        {
          error: `Lỗi biến thể: ${variantErrors.join(', ')}`,
          variantErrors,
          receivedVariations: variations
        },
        { status: 400 }
      );
    }

    // Check for duplicate SKUs in variations
    const skus = variations.map((v: any, index: number) => v.sku || `VAR-${index + 1}`);
    const duplicateSkus = skus.filter((sku: string, index: number) => skus.indexOf(sku) !== index);
    if (duplicateSkus.length > 0) {
      console.error('❌ Duplicate SKUs found:', { duplicateSkus });
      return NextResponse.json(
        {
          error: `SKU trùng lặp trong biến thể: ${duplicateSkus.join(', ')}`,
          duplicateSkus,
          receivedSKUs: skus
        },
        { status: 400 }
      );
    }
  }

  try {
    // Create product data based on type
    let productName = name;

    // For variant products, generate name from category if not provided
    if (productType === 'VARIANT' && (!name || name.trim() === '')) {
      // Get category name to generate product name
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      productName = category?.name || 'Sản phẩm biến thể';
    }

    const productData: any = {
      name: productName,
      description: description || '',
      categoryId,
      productType: productType || 'SIMPLE',
      thumbnail: body.thumbnail || null,
      galleryImages: body.galleryImages || []
    };

    if (productType === 'SIMPLE') {
      // Simple product with direct price and stock
      productData.price = parseFloat(price);
      productData.inStock = parseInt(inStock);
      productData.basePrice = body.basePrice ? parseFloat(body.basePrice) : parseFloat(price);
    } else if (productType === 'VARIANT') {
      // Variant product - calculate total stock and min price from variations
      const totalStock = variations.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0);
      const minPrice = Math.min(...variations.map((v: any) => parseFloat(v.price) || 0));

      // For variant products, main product price/stock are calculated from variants
      productData.price = minPrice > 0 ? minPrice : null; // Schema allows null
      productData.basePrice = minPrice > 0 ? minPrice : null;
      productData.inStock = totalStock > 0 ? totalStock : null; // Schema allows null
    }

    // Create new product in db by Prisma
    const product = await prisma.product.create({
      data: productData
    });

    // If variant product, create variations
    if (productType === 'VARIANT' && variations && variations.length > 0) {
      const variationPromises = variations.map((variation: any, index: number) => {
        // Generate unique SKU if not provided
        const sku = variation.sku || `${product.id.slice(-8)}-VAR-${index + 1}-${Date.now()}`;

        // Convert images to new format
        const thumbnail = variation.thumbnail || null;
        const galleryImages = Array.isArray(variation.galleryImages) ? variation.galleryImages : [];

        return prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: sku,
            attributes: variation.attributes || {},
            price: parseFloat(variation.price),
            stock: parseInt(variation.stock),
            thumbnail,
            galleryImages,
            isActive: variation.isActive !== false
          }
        });
      });

      await Promise.all(variationPromises);
    }

    // 🎯 AUDIT LOG: Product Created
    const auditDetails: any = {
      productName: productName,
      productType: productType || 'SIMPLE',
      categoryId,
      imagesCount: images?.length || 0
    };

    if (productType === 'SIMPLE') {
      auditDetails.price = parseFloat(price);
      auditDetails.inStock = parseInt(inStock);
    } else if (productType === 'VARIANT') {
      auditDetails.variationsCount = variations.length;
      auditDetails.totalStock = variations.reduce((sum: number, v: any) => sum + parseInt(v.stock), 0);
      auditDetails.priceRange = {
        min: Math.min(...variations.map((v: any) => parseFloat(v.price))),
        max: Math.max(...variations.map((v: any) => parseFloat(v.price)))
      };
    }

    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_CREATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Tạo sản phẩm ${productType === 'VARIANT' ? 'biến thể' : 'đơn'}: ${productName}`,
      details: auditDetails,
      resourceId: product.id,
      resourceType: 'Product'
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2023') {
      return NextResponse.json({ error: 'ID danh mục không hợp lệ. Vui lòng chọn danh mục hợp lệ.' }, { status: 400 });
    }

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Sản phẩm với tên này đã tồn tại.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Có lỗi xảy ra khi tạo sản phẩm. Vui lòng thử lại.' }, { status: 500 });
  }
}
