import prisma from '../libs/prismadb';

export interface IProductParams {
  category?: string | null;
  searchTerm?: string | null;
}

export async function getProducts(params: IProductParams) {
  try {
    const { category, searchTerm } = params;
    let searchString = searchTerm || '';
    let query: any = {};

    if (category) {
      query.category = category;
    }

    const products = await prisma.product.findMany({
      where: {
        ...query,
        // Tìm kiếm theo tên hoặc mô tả
        OR: [
          {
            name: {
              contains: searchString,
              // Tìm kiếm không phân biệt chữ hoa chữ thường
              mode: 'insensitive'
            },
            description: {
              contains: searchString,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        reviews: {
          include: {
            user: true
          },
          orderBy: {
            createdDate: 'desc'
          }
        },
        category: true,
        productPromotions: {
          where: {
            isActive: true
          },
          include: {
            promotion: true
          }
        }
      }
    });
    return products;
  } catch (error) {
    console.log(error);
  }
}

// Fetch parent category and products with promotion data for homepage display
export async function getParentCategoryAndProductsBySlug(parentSlug: string) {
  try {
    const parentCategory = await prisma.category.findFirst({
      where: { slug: parentSlug },
      include: {
        subcategories: {
          include: {
            products: {
              include: {
                productPromotions: {
                  where: {
                    isActive: true
                  },
                  include: {
                    promotion: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!parentCategory) {
      throw new Error(`Parent category with slug "${parentSlug}" not found.`);
    }

    // Gộp tất cả sản phẩm từ các danh mục con
    const products = parentCategory.subcategories.flatMap(subcategory => subcategory.products);

    return { parentCategory, products };
  } catch (error) {
    console.log(error);
  }
}

// Fetch products by category with promotion data for category pages
export async function getProductsByCategory(slug: string) {
  try {
    const category = await prisma.category.findFirst({
      where: { slug }
    });

    if (!category) {
      throw new Error(`Category with slug "${slug}" not found.`);
    }

    const products = await prisma.product.findMany({
      where: { categoryId: category.id },
      include: {
        productPromotions: {
          where: {
            isActive: true
          },
          include: {
            promotion: true
          }
        }
      }
    });

    return products;
  } catch (error) {
    console.error(error);
  }
}
