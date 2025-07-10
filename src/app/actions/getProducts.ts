import prisma from '../libs/prismadb';

export interface IProductParams {
  category?: string | null;
  searchTerm?: string | null;
  includeDeleted?: boolean;
}

export async function getProducts(params: IProductParams) {
  try {
    const { category, searchTerm, includeDeleted = false } = params;
    let searchString = searchTerm || '';
    let query: any = {};

    if (category) {
      query.category = category;
    }

    // TODO: Thêm filter cho soft delete sau khi update database
    // if (!includeDeleted) {
    //   query.isDeleted = { not: true };
    // }

    const products = await prisma.product.findMany({
      where: {
        ...query,
        // Chỉ áp dụng tìm kiếm khi có searchString
        ...(searchString && {
          OR: [
            {
              name: {
                contains: searchString,
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: searchString,
                mode: 'insensitive'
              }
            }
          ]
        })
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
        },
        // Include variants for variant products
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        // Include product attributes for variant products
        productAttributes: {
          include: {
            values: {
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
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
              // TODO: Add soft delete filter after database update
              // where: {
              //   isDeleted: { not: true }
              // },
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
                },
                // Include variants for variant products
                variants: {
                  where: { isActive: true },
                  orderBy: { createdAt: 'desc' }
                },
                // Include product attributes for variant products
                productAttributes: {
                  include: {
                    values: {
                      orderBy: { position: 'asc' }
                    }
                  },
                  orderBy: { position: 'asc' }
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
      where: {
        categoryId: category.id
        // TODO: Add soft delete filter after database update
        // isDeleted: { not: true }
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
        },
        // Include variants for variant products
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        // Include product attributes for variant products
        productAttributes: {
          include: {
            values: {
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    return products;
  } catch (error) {
    console.error(error);
  }
}
