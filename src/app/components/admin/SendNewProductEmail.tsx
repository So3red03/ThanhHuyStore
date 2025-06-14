'use client';

import { useState } from 'react';
import { Product } from '@prisma/client';
import axios from 'axios';
import toast from 'react-hot-toast';

interface SendNewProductEmailProps {
  products: Product[];
}

const SendNewProductEmail: React.FC<SendNewProductEmailProps> = ({ products }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSendEmails = async () => {
    if (!selectedProductId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/send-new-product-emails', {
        productId: selectedProductId
      });

      const result = response.data;
      setLastResult(result);
      
      toast.success(`Đã gửi email thành công cho ${result.sentCount}/${result.totalUsers} người dùng`);
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi gửi email');
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc sản phẩm mới (trong 30 ngày gần đây)
  const recentProducts = products.filter(product => {
    const productDate = new Date(product.createDate || product.createdAt || Date.now());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return productDate >= thirtyDaysAgo;
  }).sort((a, b) => {
    const dateA = new Date(a.createDate || a.createdAt || Date.now());
    const dateB = new Date(b.createDate || b.createdAt || Date.now());
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        📧 Gửi Email Sản Phẩm Mới
      </h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn sản phẩm mới để gửi email marketing:
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">-- Chọn sản phẩm --</option>
          {recentProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - {new Date(product.createDate || product.createdAt || Date.now()).toLocaleDateString('vi-VN')}
            </option>
          ))}
        </select>
      </div>

      {selectedProductId && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Lưu ý:</strong> Email sẽ được gửi đến những khách hàng đã từng mua sản phẩm 
            trong cùng danh mục với sản phẩm được chọn.
          </p>
        </div>
      )}

      <button
        onClick={handleSendEmails}
        disabled={isLoading || !selectedProductId}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          isLoading || !selectedProductId
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Đang gửi email...
          </div>
        ) : (
          'Gửi Email Marketing'
        )}
      </button>

      {lastResult && (
        <div className="mt-6 p-4 bg-green-50 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">Kết quả gửi email:</h3>
          <div className="text-sm text-green-700">
            <p><strong>Sản phẩm:</strong> {lastResult.product.name}</p>
            <p><strong>Danh mục:</strong> {lastResult.product.category}</p>
            <p><strong>Đã gửi:</strong> {lastResult.sentCount}/{lastResult.totalUsers} email</p>
            <p><strong>Tỷ lệ thành công:</strong> {((lastResult.sentCount / lastResult.totalUsers) * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {recentProducts.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-md">
          <p className="text-yellow-700 text-sm">
            Không có sản phẩm mới nào trong 30 ngày gần đây để gửi email marketing.
          </p>
        </div>
      )}
    </div>
  );
};

export default SendNewProductEmail;
