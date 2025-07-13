'use client';
import Button from '@/app/components/Button';
import { useCart } from '@/app/hooks/useCart';
import { useHydration } from '@/app/hooks/useHydration';
import { useRouter } from 'next/navigation';
import { formatPrice } from '../../../../../utils/formatPrice';
import Input from '@/app/components/inputs/Input';
import { FieldValues, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import TextArea from '@/app/components/inputs/TextArea';
import toast from 'react-hot-toast';
import axios from 'axios';
import { SafeUser } from '../../../../../types';

interface CartInfoClientProps {
  currentUser: SafeUser | null | undefined;
}
const CartInfoClient: React.FC<CartInfoClientProps> = ({ currentUser }) => {
  const { cartTotalAmount, handleInfoClient, handleNextStep, shippingFee, shippingFeeClient } = useCart();
  const { isHydrated } = useHydration();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [shippingFeeCheck, setShippingFeeCheck] = useState(0);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [provinceName, setProvinceName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [wardName, setWardName] = useState('');

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm<FieldValues>();

  // Hàm cập nhật giá trị id, value: label
  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  useEffect(() => {
    const fetchProvinces = async () => {
      const res = await axios.get('https://esgoo.net/api-tinhthanh/1/0.htm');
      if (res.data.error === 0) {
        setProvinces(res.data.data);
      }
    };
    fetchProvinces();
  }, []);

  const handleProvinceChange = async (e: any) => {
    const provinceId = e.target.value;
    const provinceName = e.target.options[e.target.selectedIndex].text; // Lấy tên đầy đủ
    setValue('district', '');
    setValue('ward', '');

    setProvinceName(provinceName);

    if (provinceId) {
      const res = await axios.get(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`);
      if (res.data.error === 0) {
        setDistricts(res.data.data);
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = async (e: any) => {
    const districtId = e.target.value;
    const districtName = e.target.options[e.target.selectedIndex].text; // Lấy tên đầy đủ
    setValue('ward', '');

    setDistrictName(districtName);
    if (districtId) {
      const res = await axios.get(`https://esgoo.net/api-tinhthanh/3/${districtId}.htm`);
      if (res.data.error === 0) {
        setWards(res.data.data);
      } else {
        setWards([]);
      }
    } else {
      setWards([]);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardName = e.target.options[e.target.selectedIndex].text; // Lấy tên đầy đủ
    setWardName(wardName);
  };

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) === 0 ? 40000 : 25000;
    shippingFeeClient(value);
    setShippingFeeCheck(value);
  };

  const handleNext = () => {
    setIsLoading(true);

    // Validate shipping fee
    if (shippingFeeCheck === 0) {
      toast.error('Vui lòng chọn dịch vụ giao hàng!');
      setIsLoading(false);
      return;
    }

    // Validate gender
    if (!gender) {
      toast.error('Vui lòng chọn giới tính!');
      setIsLoading(false);
      return;
    }

    // Đảm bảo rằng giá trị shippingFee, gender được cập nhật trước khi submit
    setCustomValue('gender', gender);

    // Kiểm tra tính hợp lệ của form
    setTimeout(() => {
      handleSubmit(
        data => {
          const subData = {
            ...data,
            gender: gender,
            city: provinceName,
            district: districtName,
            ward: wardName
          };
          handleInfoClient(subData);
          handleNextStep();
          router.push('/cart/checkout');
        },
        formErrors => {
          toast.error('Vui lòng nhập đầy đủ thông tin!');
        }
      )();
      setIsLoading(false);
    }, 1000);
  };

  // Show loading while hydrating to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  return (
    <div className='w-full bg-white p-2 mt-4'>
      {/* Thông tin khách hàng */}
      <h2 className='text-lg font-semibold mb-4'>Thông tin khách mua hàng</h2>
      <div className='flex items-center mb-4'>
        <div className='flex items-center mr-4'>
          <input
            type='radio'
            id='male'
            name='gender'
            value='male'
            className='mr-2'
            checked={gender === 'male'}
            onChange={e => setGender(e.target.value)}
          />
          <label htmlFor='male'>Anh</label>
        </div>
        <div className='flex items-center'>
          <input
            type='radio'
            id='female'
            name='gender'
            value='female'
            className='mr-2'
            checked={gender === 'female'}
            onChange={e => setGender(e.target.value)}
          />
          <label htmlFor='female'>Chị</label>
        </div>
      </div>
      <div className='flex flex-col lg:flex-row gap-4 mb-8 lg:col-span-2'>
        <Input
          id='name'
          label='Nhập họ tên'
          defaultValue={currentUser?.name}
          disabled={isLoading}
          register={register}
          errors={errors}
          className='!w-full !p-2'
          cartInfo={true}
          required
          autoComplete='name'
          onInput={(e: React.FormEvent<HTMLInputElement>) => {
            // Auto-fill other fields when name is filled
            const target = e.target as HTMLInputElement;
            if (target.value && currentUser) {
              // Auto-fill phone if available
              if (currentUser.phoneNumber) {
                setValue('phone', currentUser.phoneNumber);
              }
              // Set default gender
              if (!gender) {
                setGender('male');
              }
            }
          }}
        />
        <Input
          id='phone'
          label='Nhập số điện thoại'
          type='tel'
          defaultValue={currentUser?.phoneNumber}
          disabled={isLoading}
          register={register}
          errors={errors}
          className='!w-full !p-2'
          cartInfo={true}
          required
          autoComplete='tel'
          pattern='(\+84|84|0)?[0-9]{9,10}'
          title='Số điện thoại không hợp lệ'
        />
      </div>

      {/* Chọn cách nhận hàng */}
      <h2 className='text-lg font-semibold my-4'>Chọn cách nhận hàng</h2>
      {/* <div className='my-2'>
        <input type='radio' id='delivery' name='deliveryMethod' value='delivery' className='mr-2' />
        <label htmlFor='delivery'>Giao hàng tận nơi</label>
      </div> */}
      <div className='bg-[#ececec] p-4 mb-6 rounded-md'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
          <div>
            <select
              {...register('city', { required: true })}
              onChange={handleProvinceChange}
              disabled={isLoading}
              className={`block w-full p-2 rounded border-2 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${
                errors.city ? 'border-rose-400 focus:border-rose-400' : 'border-slate-300 focus:border-slate-500'
              }`}
            >
              <option value=''>Chọn Tỉnh, Thành phố</option>
              {provinces.map((province: any) => (
                <option key={province.id} value={province.id}>
                  {province.full_name}
                </option>
              ))}
            </select>
            {errors.city && <p className='text-rose-400 text-sm mt-1'>Vui lòng chọn tỉnh/thành phố</p>}
          </div>
          <div>
            <select
              {...register('district', { required: true })}
              disabled={isLoading}
              onChange={handleDistrictChange}
              className={`block w-full p-2 rounded border-2 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${
                errors.district ? 'border-rose-400 focus:border-rose-400' : 'border-slate-300 focus:border-slate-500'
              }`}
            >
              <option value=''>Chọn Quận Huyện</option>
              {districts.map((district: any) => (
                <option key={district.id} value={district.id}>
                  {district.full_name}
                </option>
              ))}
            </select>
            {errors.district && <p className='text-rose-400 text-sm mt-1'>Vui lòng chọn quận/huyện</p>}
          </div>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div>
            <select
              {...register('ward', { required: true })}
              disabled={isLoading}
              onChange={handleWardChange}
              className={`block w-full p-2 rounded border-2 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${
                errors.ward ? 'border-rose-400 focus:border-rose-400' : 'border-slate-300 focus:border-slate-500'
              }`}
            >
              <option value=''>Chọn Phường Xã</option>
              {wards.map((ward: any) => (
                <option key={ward.id} value={ward.id}>
                  {ward.full_name}
                </option>
              ))}
            </select>
            {errors.ward && <p className='text-rose-400 text-sm mt-1'>Vui lòng chọn phường/xã</p>}
          </div>
          <Input
            id='address'
            label='Số nhà, tên đường'
            disabled={isLoading}
            register={register}
            errors={errors}
            className='!w-full !p-2 !h-[39px]'
            cartInfo={true}
            required
          />
        </div>
      </div>
      <TextArea
        id='note'
        label='Lưu ý, yêu cầu khác (Không bắt buộc)'
        disabled={isLoading}
        register={register}
        errors={errors}
        className='!max-h-[80px] !min-h-[80px]'
      />
      {/* <div className="flex items-center my-4">
				<input type="checkbox" id="invoice" name="invoice" className="mr-2" />
				<label htmlFor="invoice">Xuất hóa đơn cho đơn hàng</label>
			</div> */}

      {/* Dịch vụ giao hàng */}
      <h2 className='text-lg font-semibold my-4'>Dịch vụ giao hàng</h2>
      <div className='flex items-center flex-col mb-4 gap-2'>
        <div className='flex items-center w-full gap-2'>
          <input type='radio' id='delivery_0' name='delivery' value='0' onChange={handleDeliveryChange} />
          <label htmlFor='delivery_0' className='flex items-end justify-between w-full'>
            <span>Giao hàng nhanh (2-4h)</span>
            <span className='font-semibold'>40.000đ</span>
          </label>
        </div>
        <div className='flex items-center w-full gap-2'>
          <input type='radio' id='delivery_1' name='delivery' value='1' onChange={handleDeliveryChange} />
          <label htmlFor='delivery_1' className='flex items-end justify-between w-full'>
            <span>Giao hàng tiêu chuẩn</span>
            <span className='font-semibold'>25.000đ</span>
          </label>
        </div>
      </div>

      {/* Tổng tiền và đặt hàng */}
      <div className='flex flex-col mt-5 gap-4 border-t pt-6'>
        <div className='flex justify-between '>
          <span className='font-bold'>Phí vận chuyển:</span>
          <span className='font-semibold'>{formatPrice(shippingFee)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='font-bold'>Tổng tiền:</span>
          <span className='text-indigo-600 font-semibold text-xl'>{formatPrice(cartTotalAmount)}</span>
        </div>
        <div className='mt-5 pb-3'>
          <Button label='ĐẶT HÀNG NGAY' onClick={handleNext} isLoading={isLoading} />
          <p className='text-center text-gray-500 text-sm mt-4'>
            Bạn có thể chọn hình thức thanh toán sau khi đặt hàng
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartInfoClient;
