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

  // Thêm các biến thể phổ biến và xử lý lỗi chính tả
  const expansions: { [key: string]: string[] } = {
    // Điện thoại variants
    'dien thoai': ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone', 'điện thoại'],
    'điện thoại': ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone', 'dien thoai'],
    dienthoai: ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone', 'điện thoại'],
    'đien thoai': ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone', 'điện thoại'], // Lỗi chính tả
    'dien  thoai': ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone', 'điện thoại'], // Nhiều space
    'dienj thoai': ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone', 'điện thoại'], // Lỗi gõ

    // iPhone variants
    iphone: ['i phone', 'điện thoại', 'dien thoai', 'apple', 'ip', 'iph'],
    'i phone': ['iphone', 'điện thoại', 'dien thoai', 'apple'],
    ip: ['iphone', 'i phone', 'apple'],
    iph: ['iphone', 'i phone', 'apple'],

    // Laptop variants
    laptop: ['macbook', 'may tinh', 'máy tính', 'lap top'],
    'lap top': ['laptop', 'macbook', 'may tinh', 'máy tính'],
    'may tinh': ['laptop', 'macbook', 'computer', 'máy tính'],
    'máy tính': ['laptop', 'macbook', 'computer', 'may tinh'],

    // Tai nghe variants
    'tai nghe': ['airpods', 'headphone', 'earphone', 'tainghe'],
    tainghe: ['airpods', 'headphone', 'earphone', 'tai nghe'],
    airpods: ['tai nghe', 'headphone', 'earphone'],

    // Dong ho variants
    'dong ho': ['watch', 'apple watch', 'đồng hồ'],
    'đồng hồ': ['watch', 'apple watch', 'dong ho'],
    dongho: ['watch', 'apple watch', 'đồng hồ'],

    // iPad variants
    ipad: ['may tinh bang', 'máy tính bảng', 'tablet'],
    'may tinh bang': ['ipad', 'tablet', 'máy tính bảng'],
    'máy tính bảng': ['ipad', 'tablet', 'may tinh bang']
  };

  // Thêm các từ mở rộng
  Object.keys(expansions).forEach(key => {
    if (normalized.includes(key)) {
      terms.push(...expansions[key]);
    }
  });

  // Thêm các từ riêng lẻ
  const words = normalized.split(/\s+/).filter(word => word.length > 1); // Bỏ từ quá ngắn
  terms.push(...words);

  // Xử lý các pattern phổ biến
  if (normalized.includes('16') && (normalized.includes('pro') || normalized.includes('max'))) {
    terms.push('iphone 16 pro max', 'iphone', 'apple');
  }

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
        AND: [
          {
            OR: orConditions
          },
          {
            isDeleted: false // Chỉ lấy sản phẩm chưa bị xóa
          }
        ]
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

    // Loại bỏ duplicate products (có thể match nhiều điều kiện)
    const uniqueProducts = products.filter(
      (product: any, index: any, self: any) => index === self.findIndex((p: any) => p.id === product.id)
    );

    return uniqueProducts;
  } catch (error) {
    return [];
  }
}
