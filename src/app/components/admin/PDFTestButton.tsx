'use client';

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/app/components/Button';

interface PDFTestButtonProps {
  orderId: string;
  orderPaymentIntentId: string;
}

const PDFTestButton: React.FC<PDFTestButtonProps> = ({ 
  orderId, 
  orderPaymentIntentId 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfFileId, setPdfFileId] = useState<string | null>(null);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post(`/api/orders/${orderId}/pdf`);
      
      if (response.data.fileId) {
        setPdfFileId(response.data.fileId);
        toast.success('PDF đã được tạo thành công!');
      } else {
        toast.success('PDF đã tồn tại!');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(error.response?.data?.error || 'Có lỗi khi tạo PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewPDF = () => {
    if (pdfFileId) {
      window.open(`/api/pdf/${pdfFileId}`, '_blank');
    }
  };

  const handleProcessPayment = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post('/api/orders/process-payment', {
        orderId,
        paymentIntentId: orderPaymentIntentId,
      });
      
      if (response.data.pdfFileId) {
        setPdfFileId(response.data.pdfFileId);
        toast.success('Đơn hàng đã được xử lý và PDF đã được tạo!');
      } else {
        toast.success('Đơn hàng đã được xử lý!');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.error || 'Có lỗi khi xử lý đơn hàng');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold text-sm">PDF Actions</h3>
      <div className="flex gap-2">
        <Button
          label="Tạo PDF"
          small
          onClick={handleGeneratePDF}
          isLoading={isGenerating}
          custom="!px-3 !py-1 !text-xs"
        />
        
        <Button
          label="Xử lý thanh toán"
          small
          onClick={handleProcessPayment}
          isLoading={isGenerating}
          custom="!px-3 !py-1 !text-xs !bg-green-600 hover:!bg-green-700"
        />
        
        {pdfFileId && (
          <Button
            label="Xem PDF"
            small
            onClick={handleViewPDF}
            custom="!px-3 !py-1 !text-xs !bg-blue-600 hover:!bg-blue-700"
          />
        )}
      </div>
      
      {pdfFileId && (
        <p className="text-xs text-green-600">
          PDF ID: {pdfFileId.slice(0, 8)}...
        </p>
      )}
    </div>
  );
};

export default PDFTestButton;
