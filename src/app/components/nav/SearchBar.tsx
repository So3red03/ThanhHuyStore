'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import queryString from 'query-string';
import { useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { formatPrice } from '../../utils/formatPrice';
import Image from 'next/image';
import ProductCard from '../products/ProductCard';
import { slugConvert } from '../../utils/Slug';
import Fuse from 'fuse.js';
import { Product } from '@prisma/client';
import { getDefaultImage } from '../../utils/product';

interface SearchBarProps {
  products: Product[];
}

// Utility function để normalize chuỗi
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, ' ') // Thay thế nhiều khoảng trắng bằng 1 khoảng trắng
    .trim();
};

// Utility function để tạo từ khóa tìm kiếm từ tên sản phẩm
const createSearchKeywords = (productName: string): string => {
  const normalized = normalizeString(productName);
  const words = normalized.split(' ');

  // Tạo các từ khóa bổ sung và biến thể (đồng bộ với backend)
  const keywords = [
    normalized,
    ...words,
    // Điện thoại variants
    normalized.includes('iphone') || normalized.includes('i phone') ? 'dien thoai điện thoại phone smartphone' : '',
    normalized.includes('samsung') ? 'dien thoai điện thoại samsung' : '',
    normalized.includes('galaxy') ? 'dien thoai điện thoại samsung galaxy' : '',

    // Laptop variants
    normalized.includes('macbook') ? 'laptop may tinh máy tính computer' : '',

    // iPad variants
    normalized.includes('ipad') ? 'may tinh bang máy tính bảng tablet' : '',

    // AirPods variants
    normalized.includes('airpods') ? 'tai nghe tainghe headphone earphone' : '',

    // Watch variants
    normalized.includes('watch') ? 'dong ho đồng hồ dongho' : '',

    // iPhone biến thể
    normalized.includes('iphone') ? normalized.replace('iphone', 'i phone') + ' ip iph' : '',
    normalized.includes('i phone') ? normalized.replace('i phone', 'iphone') + ' ip iph' : '',

    // Xử lý lỗi chính tả phổ biến
    normalized.includes('dien thoai') ? 'điện thoại đien thoai dienj thoai' : '',
    normalized.includes('điện thoại') ? 'dien thoai đien thoai dienj thoai' : '',

    // Từ khóa chung
    'apple'
  ]
    .filter(Boolean)
    .join(' ');

  return keywords;
};

const SearchBar: React.FC<SearchBarProps> = ({ products }) => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Cấu hình Fuse.js cho fuzzy search
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 0.6 },
      { name: 'searchKeywords', weight: 0.3 },
      { name: 'brand', weight: 0.1 }
    ],
    threshold: 0.6, // Tăng threshold để tìm kiếm rộng hơn
    distance: 200, // Tăng distance để cho phép sai khác nhiều hơn
    minMatchCharLength: 1, // Giảm xuống 1 để tìm được từ ngắn
    includeScore: true,
    ignoreLocation: true, // Bỏ qua vị trí của từ khóa
    findAllMatches: true // Tìm tất cả matches
  };

  // Tạo dữ liệu tìm kiếm với keywords
  const searchData = products?.map(product => ({
    ...product,
    brand: product.brand || 'Apple', // Default brand nếu chưa có
    searchKeywords: createSearchKeywords(product.name)
  }));

  const fuse = new Fuse(searchData, fuseOptions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      router.push('/');
      return;
    }

    const url = queryString.stringifyUrl(
      {
        url: '/search',
        query: { searchTerm: searchTerm.trim() }
      },
      { skipNull: true }
    );

    router.push(url);
    setSearchTerm('');
    setFilteredProducts([]);
  };

  // Khi người dùng gõ ký tự vào ô tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    if (searchValue.trim() === '') {
      setFilteredProducts([]);
      return;
    }

    // Normalize search term
    const normalizedSearch = normalizeString(searchValue);

    // Sử dụng Fuse.js để tìm kiếm fuzzy
    const fuseResults = fuse.search(normalizedSearch);

    // Lấy kết quả và sắp xếp theo score
    const filtered = fuseResults
      .filter(result => result.score && result.score < 0.8) // Tăng threshold để lấy nhiều kết quả hơn
      .map(result => result.item)
      .slice(0, 8); // Giới hạn 8 kết quả

    setFilteredProducts(filtered);
  };

  return (
    <div className='select-none relative w-[150px] sm:w-[220px] md:w-[270px] lg:w-[415px] float-end'>
      <form onSubmit={handleSubmit}>
        <input
          type='text'
          value={searchTerm}
          autoComplete='off'
          placeholder='Bạn cần tìm gì?'
          className='pl-4 pr-10 py-[6px] lg:py-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 w-full'
          onChange={handleSearch}
        />
        <button type='submit' className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600'>
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 10-13 0 6.5 6.5 0 0013 0z'
            />
          </svg>
        </button>
      </form>
      <div
        className={`absolute mt-1 text-sm z-20 bg-white w-full shadow-md rounded-md max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent px-4 transition-all duration-500 ease-in-out ${
          filteredProducts.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-8px] pointer-events-none'
        }`}
      >
        {filteredProducts.map(product => (
          <div key={product.id} className='px-2 py-3 flex justify-between items-center border-b border-gray-300'>
            <div>
              <Link
                href={`/product/${slugConvert(product.name)}-${product.id}`}
                className='text-[#111111] hover:text-slate-400 transition-colors duration-150 cursor-pointer'
              >
                {product.name}
              </Link>
              <p className='text-[#d43232] text-xs font-bold'>{formatPrice(product.price)}</p>
            </div>
            <div>
              <Image
                src={getDefaultImage(product)}
                alt={product.name}
                width={40}
                height={40}
                className='object-cover rounded'
                onError={e => {
                  e.currentTarget.src = '/noavatar.png';
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {searchTerm.trim() !== '' && filteredProducts.length === 0 && (
        <div
          className={`absolute z-20 mt-1 text-sm bg-white w-full shadow-md rounded-md max-h-60 overflow-y-auto text-center p-4 transition-all duration-500 ease-in-out opacity-100 ${
            filteredProducts.length === 0
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-[-8px] pointer-events-none'
          }`}
        >
          Không có sản phẩm nào...
        </div>
      )}
    </div>
  );
};

export default SearchBar;
