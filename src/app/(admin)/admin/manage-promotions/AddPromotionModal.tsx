'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import AdminModal from '@/app/components/admin/AdminModal';
import Button from '@/app/components/Button';
import Input from '@/app/components/inputs/Input';
import Heading from '@/app/components/Heading';
import FormWarp from '@/app/components/FormWrap';
import { useRouter } from 'next/navigation';

interface AddPromotionModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  products: any[];
  categories: any[];
  promotion?: any;
  isEdit?: boolean;
}

const AddPromotionModal: React.FC<AddPromotionModalProps> = ({
  isOpen,
  toggleOpen,
  products,
  categories,
  promotion,
  isEdit = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPromotionCreated, setIsPromotionCreated] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues:
      isEdit && promotion
        ? {
            title: promotion.title,
            description: promotion.description,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().slice(0, 16) : '',
            endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().slice(0, 16) : '',
            applyToAll: promotion.applyToAll,
            isActive: promotion.isActive
          }
        : {}
  });

  // Clear form sau khi tạo thành công
  useEffect(() => {
    if (isPromotionCreated) {
      reset();
      setSelectedProducts([]);
      setSelectedCategories([]);
      setIsPromotionCreated(false);
    }
  }, [isPromotionCreated, reset]);

  // Load existing data for edit
  useEffect(() => {
    if (isEdit && promotion) {
      setSelectedProducts(promotion.productIds || []);
      setSelectedCategories(promotion.categoryIds || []);
    }
  }, [isEdit, promotion]);

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    try {
      const promotionData = {
        ...data,
        discountValue: parseFloat(data.discountValue),
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        applyToAll: data.applyToAll || false,
        productIds: data.applyToAll ? [] : selectedProducts,
        categoryIds: data.applyToAll ? [] : selectedCategories
      };

      if (isEdit && promotion) {
        await axios.put(`/api/promotion/${promotion.id}`, promotionData);
        toast.success('Cập nhật promotion thành công');
      } else {
        await axios.post('/api/promotion', promotionData);
        toast.success('Thêm promotion thành công');
        setIsPromotionCreated(true);
      }

      router.refresh();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      toggleOpen();
    }
  };

  const discountTypeOptions = [
    { label: 'Phần trăm (%)', value: 'PERCENTAGE' },
    { label: 'Số tiền cố định (VNĐ)', value: 'FIXED' }
  ];

  const productOptions = products?.map(product => ({
    label: product.name,
    value: product.id
  }));

  const categoryOptions = categories?.map(category => ({
    label: category.name,
    value: category.id
  }));

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const applyToAll = watch('applyToAll');

  return (
    <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
      <FormWarp custom='!pt-1'>
        <Heading title={isEdit ? 'Cập nhật Promotion' : 'Thêm Promotion'} center>
          <></>
        </Heading>

        <Input
          id='title'
          label='Tên chiến dịch'
          disabled={isLoading}
          register={register}
          errors={errors}
          required
          placeholder='VD: Black Friday 2024'
        />

        <Input
          id='description'
          label='Mô tả'
          disabled={isLoading}
          register={register}
          errors={errors}
          placeholder='VD: Giảm giá sốc cuối năm'
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            id='discountType'
            label='Loại giảm giá'
            disabled={isLoading}
            type='combobox'
            register={register}
            errors={errors}
            options={discountTypeOptions}
            required
          />

          <Input
            id='discountValue'
            label='Giá trị giảm'
            disabled={isLoading}
            register={register}
            errors={errors}
            type='number'
            required
            placeholder='VD: 20 (cho 20% hoặc 20000 VNĐ)'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            id='startDate'
            label='Ngày bắt đầu'
            disabled={isLoading}
            register={register}
            errors={errors}
            type='datetime-local'
            required
          />

          <Input
            id='endDate'
            label='Ngày kết thúc'
            disabled={isLoading}
            register={register}
            errors={errors}
            type='datetime-local'
            required
          />
        </div>

        <div className='flex items-center gap-2 mb-4'>
          <input id='applyToAll' type='checkbox' {...register('applyToAll')} disabled={isLoading} className='w-4 h-4' />
          <label htmlFor='applyToAll' className='text-sm'>
            Áp dụng cho toàn bộ website
          </label>
        </div>

        {!applyToAll && (
          <>
            <div className='mb-4'>
              <label className='block text-sm font-medium mb-2'>
                Chọn sản phẩm ({selectedProducts.length} đã chọn)
              </label>
              <div className='max-h-40 overflow-y-auto border rounded p-2'>
                {products?.map(product => (
                  <div key={product.id} className='flex items-center gap-2 p-1'>
                    <input
                      type='checkbox'
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleProductSelect(product.id)}
                      className='w-4 h-4'
                    />
                    <span className='text-sm'>{product.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='mb-4'>
              <label className='block text-sm font-medium mb-2'>
                Chọn danh mục ({selectedCategories.length} đã chọn)
              </label>
              <div className='max-h-40 overflow-y-auto border rounded p-2'>
                {categories.map(category => (
                  <div key={category.id} className='flex items-center gap-2 p-1'>
                    <input
                      type='checkbox'
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategorySelect(category.id)}
                      className='w-4 h-4'
                    />
                    <span className='text-sm'>{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {isEdit && (
          <div className='flex items-center gap-2'>
            <input id='isActive' type='checkbox' {...register('isActive')} disabled={isLoading} className='w-4 h-4' />
            <label htmlFor='isActive' className='text-sm'>
              Kích hoạt promotion
            </label>
          </div>
        )}

        <Button
          label={isEdit ? 'Cập nhật Promotion' : 'Tạo Promotion'}
          isLoading={isLoading}
          onClick={handleSubmit(onSubmit)}
        />
      </FormWarp>
    </AdminModal>
  );
};

export default AddPromotionModal;
