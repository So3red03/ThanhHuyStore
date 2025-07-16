import Link from 'next/link';

export default function CategoryNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Danh mục không tồn tại
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Về trang chủ
          </Link>
          <Link
            href="/products"
            className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}
