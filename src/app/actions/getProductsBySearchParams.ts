import prisma from '../libs/prismadb';
export interface IParams {
  searchTerm?: string | null;
}

// Utility function để normalize chuỗi tìm kiếm
const normalizeSearchTerm = (term: string): string => {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
};

// Tạo các từ khóa tìm kiếm mở rộng
const expandSearchTerms = (searchTerm: string): string[] => {
  const normalized = normalizeSearchTerm(searchTerm);
  const terms = [searchTerm, normalized];

  // Thêm các biến thể phổ biến
  const expansions: { [key: string]: string[] } = {
    'dien thoai': ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone'],
    'điện thoại': ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone'],
    dienthoai: ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone'],
    iphone: ['i phone', 'điện thoại', 'dien thoai', 'apple'],
    'i phone': ['iphone', 'điện thoại', 'dien thoai', 'apple'],
    laptop: ['macbook', 'may tinh', 'máy tính'],
    'may tinh': ['laptop', 'macbook', 'computer'],
    'máy tính': ['laptop', 'macbook', 'computer'],
    'tai nghe': ['airpods', 'headphone', 'earphone'],
    'dong ho': ['watch', 'apple watch'],
    'đồng hồ': ['watch', 'apple watch']
  };

  // Thêm các từ mở rộng
  Object.keys(expansions).forEach(key => {
    if (normalized.includes(key)) {
      terms.push(...expansions[key]);
    }
  });

  // Thêm các từ riêng lẻ
  const words = normalized.split(/\s+/);
  terms.push(...words);

  return [...new Set(terms)]; // Loại bỏ duplicate
};

export async function getProductsBySearchParams(params: IParams) {
  try {
    const { searchTerm } = params;
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }

    const searchTerms = expandSearchTerms(searchTerm);

    // Tạo điều kiện OR cho tất cả các từ khóa
    const orConditions = searchTerms.flatMap(term => [
      {
        name: {
          contains: term,
          mode: 'insensitive' as const
        }
      },
      {
        description: {
          contains: term,
          mode: 'insensitive' as const
        }
      },
      {
        brand: {
          contains: term,
          mode: 'insensitive' as const
        }
      }
    ]);

    const products = await prisma.product.findMany({
      where: {
        OR: orConditions
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
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

    // Loại bỏ duplicate products (có thể match nhiều điều kiện)
    const uniqueProducts = products.filter(
      (product: any, index: any, self: any) => index === self.findIndex((p: any) => p.id === product.id)
    );

    return uniqueProducts;
  } catch (error) {
    console.log('Error in getProductsBySearchParams:', error);
    return [];
  }
}
