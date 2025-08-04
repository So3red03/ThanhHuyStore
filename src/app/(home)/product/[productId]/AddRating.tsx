'use client';
import { Order, OrderStatus, Product, Review } from '@prisma/client';
import { SafeUser } from '../../../../../types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FieldValue, FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Rating } from '@mui/material';
import Button from '@/app/components/Button';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import AdminModal from '@/app/components/admin/AdminModal';
import Image from 'next/image';
import { getDefaultImage } from '../../../utils/product';

// Export the utility function for backward compatibility
export const getProductFirstImage = getDefaultImage;

interface AddRatingProps {
  product: Product & { reviews: Review[] }; // Reviews có thể không có, để TypeScript biết đây là optional
  user: (SafeUser & { orders: Order[] }) | undefined | null;
}

const AddRating: React.FC<AddRatingProps> = ({ product, user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hoverValue, setHoverValue] = useState(-1);
  const [selectedValue, setSelectedValue] = useState(-1);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FieldValues>();

  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const canComment = user?.orders.some(
    order => order.products.some(item => item.id === product.id) && order.status === OrderStatus.completed
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedValue(-1);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    // if (!canComment) {
    //   toast.error('Bạn cần mua hàng để đánh giá');
    //   return;
    // }
    setIsOpen(!isOpen);
  };

  const toggleOpenWarning = () => {
    setIsWarning(!isWarning);
  };

  const handleConfirm = () => {
    router.push('/login');
  };

  const handleHover = (event: any, newValue: any) => {
    setHoverValue(newValue);
  };

  const handleClick = (event: any, newValue: any) => {
    setIsSuccess(true);
    setSelectedValue(newValue);
    setValue('rating', newValue);
  };

  const ratingLabels: any = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Tốt',
    5: 'Xuất sắc'
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);
    if (selectedValue === -1) {
      setIsLoading(false);
      toast.error('Chưa chọn đánh giá');
      return;
    }
    if (!data.comment || data.comment.trim().length === 0) {
      setIsLoading(false);
      toast.error('Chưa có thông tin đánh giá');
      return;
    }

    if (user) {
      axios
        .post('/api/rating', {
          userId: user?.id,
          product: product,
          comment: data.comment,
          rating: selectedValue
        })
        .then(res => {
          toast.success('Đánh giá thành công');
          router.refresh();
          reset();
        })
        .catch(error => {
          toast.error('Chưa chọn đánh giá');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      toggleOpenWarning();
      setIsLoading(false);
    }
  };
  // Kiểm tra xem sản phẩm này đã được currentUser đánh giá chưa
  const userReview = product.reviews.find((review: Review) => {
    return review.userId === user?.id;
  });

  if (userReview) return null;

  return (
    <>
      <div className='w-full mt-6'>
        <div className='flex flex-col w-full md:w-[30%] gap-2 float-start'>
          <button
            className='flex items-center justify-center gap-2 bg-slate-700 text-white rounded-md py-2 px-4 hover:opacity-80 transition'
            onClick={() => {
              toggleOpen();
            }}
          >
            <svg viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg' className='w-4 h-4'>
              <path
                d='M9 1L11.2142 2.53226H13.9459L14.7858 5L17 6.53226L16.1601 9L17 11.4677L14.7858 13L13.9459 15.4677H11.2142L9 17L6.78579 15.4677H4.05408L3.21421 13L1 11.4677L1.83987 9L1 6.53226L3.21421 5L4.05408 2.53226H6.78579L9 1Z'
                fill='white'
                stroke='white'
                strokeWidth='2'
                strokeMiterlimit='10'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M5.96393 12.3153L6.53255 9.63125L4.54238 7.79219C4.54238 7.79219 4.25806 7.54367 4.35284 7.19574C4.44762 6.84781 4.82669 6.84781 4.82669 6.84781L7.48025 6.59929L8.52272 4.06438C8.52272 4.06438 8.66487 3.66675 8.99657 3.66675C9.32827 3.66675 9.47042 4.06438 9.47042 4.06438L10.5129 6.59929L13.2612 6.84781C13.2612 6.84781 13.5455 6.89752 13.6403 7.19574C13.7351 7.49397 13.5455 7.69278 13.5455 7.69278L11.4606 9.63125L12.0292 12.4147C12.0292 12.4147 12.124 12.7129 11.887 12.9117C11.6501 13.1105 11.271 12.9117 11.271 12.9117L8.99657 11.4703L6.76947 12.9117C6.76947 12.9117 6.43778 13.1105 6.15347 12.9117C5.86915 12.7129 5.96393 12.3153 5.96393 12.3153Z'
                fill='#334155'
              />
            </svg>
            Gửi đánh giá của bạn
          </button>
        </div>
      </div>
      {isOpen && (
        <AdminModal isOpen={isOpen} handleClose={toggleOpen} maxWidth='md'>
          <div className='bg-white rounded-lg shadow-lg mx-auto'>
            <div className='grid grid-cols-12'>
              {/* Sản phẩm */}
              <div className='relative hidden col-span-4 p-7 bg-slate-600 text-white lg:flex flex-col items-center'>
                <Image
                  src={getProductFirstImage(product)}
                  alt='ThanhHuy Store'
                  className='object-contain !static'
                  fill
                  sizes='100%'
                  onError={e => {
                    e.currentTarget.src = '/noavatar.png';
                  }}
                />
                <h2 className='my-4 text-center'>{product.name}</h2>
              </div>

              {/* Form đánh giá */}
              <div className='col-span-12 lg:col-span-8 p-4 pt-0'>
                <div className='flex justify-between items-center py-4 border-b border-gray-300'>
                  <div className='flex items-center gap-2'>
                    <p>Đánh giá của bạn về</p>
                    <p className='font-bold text-gray-700'>{product.name}</p>
                  </div>
                  <button
                    className='text-gray-500 hover:text-gray-700'
                    onClick={() => {
                      toggleOpen();
                    }}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      className='w-6 h-6'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>

                <div className='py-4 border-b border-gray-300 flex items-center gap-2'>
                  <label className='font-bold'>Mức độ đánh giá *</label>
                  <div className='flex items-center'>
                    {/* Icon sao - đánh giá */}
                    <div className='flex items-center gap-3'>
                      <Rating onChange={handleClick} onChangeActive={handleHover} />
                      <span className='text-xs'>
                        {selectedValue !== -1
                          ? ratingLabels[selectedValue]
                          : hoverValue !== -1
                          ? ratingLabels[hoverValue]
                          : 'Click review!'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-sm flex items-center absolute gap-2 right-5 ${
                      isSuccess ? 'border-none' : 'border'
                    } rounded-full border-[#ececec] p-1`}
                  >
                    {!isSuccess ? (
                      <>
                        <span className='text-[#E30019] text-xs'>Vui lòng chọn mức độ đánh giá</span>
                        <Image
                          src='https://file.hstatic.net/200000060274/file/cancel_88885f5b0d904a5d840a4792b49d9cdd.png'
                          width={22}
                          height={22}
                          alt='error'
                        />
                      </>
                    ) : (
                      <Image
                        src='https://file.hstatic.net/200000060274/file/success_56b81eb9c8954c5295630749af3078b5.png'
                        width={22}
                        height={22}
                        alt='success'
                      />
                    )}
                  </span>
                </div>

                <div className='mt-4'>
                  <label className='font-bold'>Đánh giá</label>
                  <textarea
                    {...register('comment', { required: true })}
                    className={`mt-2 w-full p-2 border focus:outline-none focus:border-gray-300 ${
                      errors.comment ? 'border-red-500' : 'border-gray-300'
                    } rounded text-xs`}
                    placeholder='Ví dụ: Tôi đã mua sản phẩm cách đây 1 tháng và rất hài lòng về nó ...'
                  ></textarea>
                </div>
                <div className='mt-20 flex justify-end'>
                  <Button
                    label='Gửi đánh giá'
                    custom='!w-[40%] !py-1 !px-4'
                    onClick={handleSubmit(onSubmit)}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
      {isWarning && (
        <ConfirmDialog isOpen={isWarning} handleClose={toggleOpenWarning} onConfirm={handleConfirm} alert={true}>
          Bạn cần đăng nhập để đánh giá sản phẩm
        </ConfirmDialog>
      )}
    </>
  );
};

export default AddRating;
