'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import firebase from '@/app/libs/firebase';
import AdminModal from '@/app/components/admin/AdminModal';
import Button from '@/app/components/Button';
import Input from '@/app/components/inputs/Input';
import Heading from '@/app/components/Heading';
import FormWarp from '@/app/components/FormWrap';
import { useRouter } from 'next/navigation';

interface AddVoucherModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  users: any[];
  voucher?: any;
  isEdit?: boolean;
}

const AddVoucherModal: React.FC<AddVoucherModalProps> = ({ isOpen, toggleOpen, users, voucher, isEdit = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVoucherCreated, setIsVoucherCreated] = useState(false);
  const [voucherImage, setVoucherImage] = useState<File | string | null>(null);
  const router = useRouter();
  const storage = getStorage(firebase);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues:
      isEdit && voucher
        ? {
            code: voucher.code,
            description: voucher.description,
            image: voucher.image,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            minOrderValue: voucher.minOrderValue,
            maxDiscount: voucher.maxDiscount,
            quantity: voucher.quantity,
            maxUsagePerUser: voucher.maxUsagePerUser,
            startDate: voucher.startDate ? new Date(voucher.startDate).toISOString().slice(0, 16) : '',
            endDate: voucher.endDate ? new Date(voucher.endDate).toISOString().slice(0, 16) : '',
            voucherType: voucher.voucherType,
            isActive: voucher.isActive
          }
        : {}
  });

  // Clear form sau khi tạo thành công
  useEffect(() => {
    if (isVoucherCreated) {
      reset();
      setVoucherImage(null);
      setIsVoucherCreated(false);
    }
  }, [isVoucherCreated, reset]);

  // Load existing image for edit
  useEffect(() => {
    if (isEdit && voucher && voucher.image) {
      setVoucherImage(voucher.image);
    }
  }, [isEdit, voucher]);

  // Auto generate voucher code
  const generateVoucherCode = () => {
    const prefix = watch('voucherType') || 'GENERAL';
    const randomNum = Math.floor(Math.random() * 10000);
    const code = `${prefix.substring(0, 3)}${randomNum}`;
    setValue('code', code);
  };

  // Upload image to Firebase
  const uploadImageToFirebase = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileName = new Date().getTime() + '-' + imageFile.name;
      const storageRef = ref(storage, `vouchers/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        error => {
          console.error('Error uploading image:', error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then(downloadURL => {
              resolve(downloadURL);
            })
            .catch(error => {
              reject(error);
            });
        }
      );
    });
  };

  // Delete old image from Firebase
  const deleteOldImageFromFirebase = async (imageUrl: string) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    try {
      let imageUrl = voucherImage || data.image;

      // Handle image upload if there's a new image
      if (voucherImage && voucherImage !== data.image && voucherImage instanceof File) {
        // Delete old image if editing
        if (isEdit && data.image) {
          await deleteOldImageFromFirebase(data.image);
        }

        // Upload new image
        imageUrl = await uploadImageToFirebase(voucherImage);
      }

      const voucherData = {
        ...data,
        image: imageUrl,
        discountValue: parseFloat(data.discountValue),
        minOrderValue: data.minOrderValue ? parseFloat(data.minOrderValue) : null,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        quantity: parseInt(data.quantity),
        maxUsagePerUser: data.maxUsagePerUser ? parseInt(data.maxUsagePerUser) : 1,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        targetUserIds: data.targetUserIds || []
      };

      if (isEdit && voucher) {
        await axios.put(`/api/voucher/${voucher.id}`, voucherData);
        toast.success('Cập nhật voucher thành công');
      } else {
        await axios.post('/api/voucher', voucherData);
        toast.success('Thêm voucher thành công');
        setIsVoucherCreated(true);
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

  const voucherTypeOptions = [
    { label: 'Khách hàng mới', value: 'NEW_USER' },
    { label: 'Khuyến khích quay lại', value: 'RETARGETING' },
    { label: 'Tăng giá trị đơn hàng', value: 'UPSELL' },
    { label: 'Khách hàng thân thiết', value: 'LOYALTY' },
    { label: 'Sự kiện đặc biệt', value: 'EVENT' },
    { label: 'Chung', value: 'GENERAL' }
  ];

  return (
    <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
      <FormWarp custom='!pt-1'>
        <Heading title={isEdit ? 'Cập nhật Voucher' : 'Thêm Voucher'} center>
          <></>
        </Heading>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='flex gap-2'>
            <Input
              id='code'
              label='Mã Voucher'
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              placeholder='VD: SALE50'
            />
            <Button label='Tạo mã' small onClick={generateVoucherCode} custom='!h-12 !mt-6 !px-3' />
          </div>

          <Input
            id='voucherType'
            label='Loại Voucher'
            disabled={isLoading}
            type='combobox'
            register={register}
            errors={errors}
            options={voucherTypeOptions}
            required
          />
        </div>

        <Input
          id='description'
          label='Mô tả'
          disabled={isLoading}
          register={register}
          errors={errors}
          placeholder='VD: Giảm 50K cho đơn hàng từ 300K'
        />

        <div className='relative w-full p-3 pt-7 outline-none bg-white font-light border-2 rounded-md transition border-slate-300 focus:border-slate-500'>
          <label className='absolute top-[-0.02rem] text-[16.5px] scale-75 text-slate-400'>Ảnh voucher</label>
          <div className='flex items-center'>
            <span className='mr-3 text-sm text-gray-500'>
              {voucherImage ? (
                <div className='mt-2'>
                  {voucherImage instanceof File ? (
                    <img
                      src={URL.createObjectURL(voucherImage)}
                      alt='Voucher preview'
                      className='mt-2 rounded-md'
                      style={{ maxWidth: '80px', maxHeight: '80px' }}
                    />
                  ) : (
                    <img
                      src={voucherImage}
                      alt='Voucher preview'
                      className='mt-2 rounded-md'
                      style={{ maxWidth: '80px', maxHeight: '80px' }}
                    />
                  )}
                </div>
              ) : (
                'Chưa có file nào được chọn'
              )}
            </span>
            <label
              htmlFor='voucherImage'
              className='cursor-pointer bg-slate-600 text-white px-4 py-1 rounded-md shadow-sm hover:bg-slate-700 transition'
            >
              {voucherImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
            </label>

            <input
              id='voucherImage'
              type='file'
              accept='image/*'
              autoComplete='off'
              disabled={isLoading}
              onChange={(e: any) => setVoucherImage(e.target.files?.[0] || null)}
              className='hidden'
            />
          </div>
        </div>

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
            placeholder='VD: 50 (cho 50% hoặc 50000 VNĐ)'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            id='minOrderValue'
            label='Giá trị đơn tối thiểu (VNĐ)'
            disabled={isLoading}
            register={register}
            errors={errors}
            type='number'
            placeholder='VD: 300000'
          />

          <Input
            id='maxDiscount'
            label='Giảm tối đa (VNĐ)'
            disabled={isLoading}
            register={register}
            errors={errors}
            type='number'
            placeholder='VD: 100000 (chỉ cho loại %)'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            id='quantity'
            label='Số lượng voucher'
            disabled={isLoading}
            register={register}
            errors={errors}
            type='number'
            required
            placeholder='VD: 100'
          />

          <Input
            id='maxUsagePerUser'
            label='Số lần dùng/người'
            disabled={isLoading}
            register={register}
            errors={errors}
            type='number'
            placeholder='VD: 1 (mặc định)'
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

        {isEdit && (
          <div className='flex items-center gap-2'>
            <input id='isActive' type='checkbox' {...register('isActive')} disabled={isLoading} className='w-4 h-4' />
            <label htmlFor='isActive' className='text-sm'>
              Kích hoạt voucher
            </label>
          </div>
        )}

        <Button
          label={isEdit ? 'Cập nhật Voucher' : 'Tạo Voucher'}
          isLoading={isLoading}
          onClick={handleSubmit(onSubmit)}
        />
      </FormWarp>
    </AdminModal>
  );
};

export default AddVoucherModal;
