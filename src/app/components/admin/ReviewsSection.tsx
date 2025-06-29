'use client';

import { useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/app/components/Button';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';

type Review = {
  id: any;
  userId: any;
  productId: any;
  rating: number;
  comment: any;
  reply: any;
  createdDate: any;
  product: {
    id: any;
    name: any;
    description: any;
    price: any;
    category: any;
    inStock: any;
    images: any[];
  };
  user: {
    id: any;
    name: any;
    email: any;
    emailVerified: any;
    image: any;
    hashedPassword: any;
    createAt: any;
    updateAt: any;
    role: any;
  };
};

interface ReviewsSectionProps {
  reviews: Review[];
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdateOpen, setisUpdateOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [selectedReview, setselectedReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredReviewId, setHoveredReviewId] = useState(null);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<FieldValues>();

  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleUpdateOpen = () => setisUpdateOpen(!isUpdateOpen);
  const toggleDelete = () => setIsDelete(!isDelete);

  const onSubmit: SubmitHandler<FieldValues> = data => {
    if (selectedReview?.reply && !isEditing) {
      toast.error('Bình luận này đã được phản hồi');
      setValue('reply', '');
      return;
    }

    setIsLoading(true);

    const apiEndpoint = isEditing ? '/api/commentUpdate' : '/api/commentReply';
    const payload = isEditing
      ? { id: selectedReview?.id, edit: data.edit }
      : { id: selectedReview?.id, reply: data.reply };

    axios
      .put(apiEndpoint, payload)
      .then(() => {
        toast.success(isEditing ? 'Sửa phản hồi thành công' : 'Phản hồi thành công');
        router.refresh();
        setValue(isEditing ? 'edit' : 'reply', '');
      })
      .catch(error => {
        console.error(error);
        toast.error('Có lỗi khi phản hồi');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleConfirmDelete = () => {
    if (selectedReview) {
      handleDeleteReviews(selectedReview.id);
    }
    toggleDelete();
  };

  const handleDeleteReviews = (id: any) => {
    axios
      .delete(`/api/reviews/${id}`)
      .then(res => {
        toast.success('Xóa đánh giá thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi xóa');
      });
  };

  return (
    <>
      <div className='mb-4 rounded-lg border border-gray-200 w-full p-6 pr-0 pb-2 flex-1'>
        <h2 className='text-gray-500 mb-4 font-semibold text-lg'>Đánh giá sản phẩm gần đây</h2>
        <div className='h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent'>
          {reviews?.map((review: any) => (
            <div
              key={review.id}
              className='flex flex-col items-start my-6 mr-3'
              onMouseEnter={() => setHoveredReviewId(review.id)}
              onMouseLeave={() => setHoveredReviewId(null)}
            >
              <div className='flex items-start gap-3'>
                <div className='relative inline-block rounded-full overflow-hidden h-11 w-11'>
                  <Image alt='Avatar' src='/no-avatar-2.jpg' fill sizes='100%' />
                </div>
                <div>
                  <Link href={`/product/${review.product.id}`}>
                    <span className='text-sm'>Đánh giá </span>
                    <span className='font-semibold text-blue-500 text-sm hover:underline'>{review.product.name}</span>
                  </Link>
                  <div className='flex items-center gap-2 my-2'>
                    <span className='text-blue-500 text-sm'>{review.user.name}</span>
                    <span className='text-gray-400 text-xs'>{formatDate(review.createdDate)}</span>
                  </div>
                </div>
              </div>
              <div className='w-full'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm mt-1'>{review.comment}</p>
                  {review.reply ? (
                    <p className='text-xs text-gray-500'>(Đã phản hồi)</p>
                  ) : (
                    <p className='text-xs text-gray-500'>(Chưa phản hồi)</p>
                  )}
                </div>
                {/* Hover actions */}
                <div
                  className={`text-blue-500 text-xs mt-1 transition-opacity duration-150 ${
                    hoveredReviewId === review.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <a
                    className='hover:underline cursor-pointer'
                    onClick={() => {
                      setselectedReview(review);
                      setIsEditing(false);
                      toggleOpen();
                      setisUpdateOpen(false);
                    }}
                  >
                    Phản hồi{' '}
                  </a>
                  |
                  <a
                    className={`hover:underline ml-1 cursor-pointer ${
                      !review.reply ? 'text-gray-400 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!review.reply) {
                        toast.error('Bạn cần phản hồi trước khi có thể sửa');
                        return;
                      }
                      setselectedReview(review);
                      setIsEditing(true);
                      toggleUpdateOpen();
                      setIsOpen(false);
                    }}
                  >
                    Sửa{' '}
                  </a>
                  |
                  <a
                    className='hover:underline text-red-600 ml-1 cursor-pointer'
                    onClick={() => {
                      setselectedReview(review);
                      toggleDelete();
                    }}
                  >
                    Xóa{' '}
                  </a>
                  |
                  <a href={`/product/${review.product.id}#comment-${review.id}`} className='hover:underline ml-1'>
                    Xem{' '}
                  </a>
                </div>
              </div>

              {/* Reply form */}
              <div
                className={`transition-transform duration-300 ease-in-out w-full ${
                  isOpen ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
                }`}
              >
                {isOpen && selectedReview?.id === review.id && (
                  <div className='mt-2 p-2 border rounded'>
                    <p className='font-semibold text-sm py-1'>Phản hồi bình luận</p>
                    <textarea
                      {...register('reply', { required: true })}
                      className={`w-full h-24 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 rounded-md p-2 text-sm ${
                        errors.reply ? 'border-red-500' : ''
                      }`}
                      placeholder='Nhập phản hồi của bạn...'
                    ></textarea>
                    <div className='flex justify-start mt-2'>
                      <Button
                        label='Lưu'
                        small
                        custom='!px-4 !py-1 !text-sm !mr-2 !rounded-md !w-fit '
                        onClick={handleSubmit(onSubmit)}
                        isLoading={isLoading}
                      />
                      <button
                        className='bg-gray-300 text-gray-700 px-4 py-1 text-sm rounded-md hover:opacity-80'
                        onClick={() => {
                          setIsOpen(false);
                          setselectedReview(null);
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit form */}
              <div
                className={`transition-transform duration-300 ease-in-out w-full ${
                  isUpdateOpen ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
                }`}
              >
                {isUpdateOpen && selectedReview?.id === review.id && (
                  <div className='mt-2 p-2 border rounded'>
                    <p className='font-semibold text-sm py-1'>Sửa phản hồi</p>
                    <textarea
                      {...register('edit', { required: true })}
                      defaultValue={selectedReview?.reply}
                      className={`w-full h-24 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 rounded-md p-2 text-sm ${
                        errors.reply ? 'border-red-500' : ''
                      }`}
                      placeholder='Nhập phản hồi của bạn...'
                    ></textarea>
                    <div className='flex justify-start mt-2'>
                      <Button
                        label='Lưu'
                        small
                        custom='!px-4 !py-1 !text-sm !mr-2 !rounded-md !w-fit '
                        onClick={handleSubmit(onSubmit)}
                        isLoading={isLoading}
                      />
                      <button
                        className='bg-gray-300 text-gray-700 px-4 py-1 text-sm rounded-md hover:opacity-80'
                        onClick={() => {
                          setisUpdateOpen(false);
                          setselectedReview(null);
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}
    </>
  );
};

export default ReviewsSection;
