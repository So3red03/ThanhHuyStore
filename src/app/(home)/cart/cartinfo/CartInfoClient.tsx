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
import { useCartStore } from '@/stores/cartStore';

interface CartInfoClientProps {
  currentUser: SafeUser | null | undefined;
}
const CartInfoClient: React.FC<CartInfoClientProps> = ({ currentUser }) => {
  const { cartTotalAmount, handleInfoClient, handleNextStep, shippingFee, shippingFeeClient, setOrderNote } = useCart();
  const { isHydrated } = useHydration();
  const { setShippingAddress, setShippingType, markShippingCalculated, shippingAddress } = useCartStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [provinceName, setProvinceName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [wardName, setWardName] = useState('');
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingBreakdown, setShippingBreakdown] = useState<any>(null);

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

    // Initialize address from cartStore if available
    if (shippingAddress) {
      setProvinceName(shippingAddress.province);
      setDistrictName(shippingAddress.district);
      setWardName(shippingAddress.ward);
    }
  }, [shippingAddress]);

  // Recalculate shipping when cart total changes
  useEffect(() => {
    if (provinceName && districtName && wardName && cartTotalAmount > 0) {
      calculateShippingOptions();
    }
  }, [cartTotalAmount]);

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

    // Auto-calculate shipping when address is complete
    if (provinceName && districtName && wardName) {
      calculateShippingOptions();
    }
  };

  // Function to calculate shipping options when address is complete
  const calculateShippingOptions = async () => {
    if (!provinceName || !districtName || !wardName) return;

    setIsCalculatingShipping(true);
    try {
      const response = await fetch('/api/orders/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerAddress: {
            province: provinceName,
            district: districtName,
            ward: wardName
          },
          orderValue: cartTotalAmount
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShippingOptions(data.shippingOptions);
          setShippingBreakdown(data.breakdown);

          // Update cart store with address
          setShippingAddress({ province: provinceName, district: districtName, ward: wardName });

          // Auto-apply standard shipping only if we have valid data
          const standardOption = data.shippingOptions.find((opt: any) => opt.type === 'standard');
          if (standardOption) {
            const shippingFee = standardOption.fee;

            setShippingType('standard');
            markShippingCalculated(true);
            shippingFeeClient(shippingFee);
          }

          // Show free shipping notification if applicable
          if (data.breakdown.isFreeShipping) {
            toast('Đơn hàng được miễn phí vận chuyển!');
          }
        }
      }
    } catch (error) {
      console.error('Auto shipping calculation error:', error);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleNext = () => {
    setIsLoading(true);

    // Validate address is selected (shipping will be auto-calculated)
    if (!provinceName || !districtName || !wardName) {
      toast.error('Vui lòng chọn địa chỉ giao hàng!');
      setIsLoading(false);
      return;
    }

    // Kiểm tra tính hợp lệ của form
    setTimeout(() => {
      handleSubmit(
        data => {
          const subData = {
            ...data,
            city: provinceName,
            district: districtName,
            ward: wardName
          };
          handleInfoClient(subData);

          // Sync note to orderNote store
          if (data.note) {
            setOrderNote(data.note);
          }

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
          <div>
            <input
              type='text'
              id='address'
              placeholder='Số nhà, tên đường'
              {...register('address', { required: true })}
              disabled={isLoading}
              className={`block w-full p-2 rounded border-2 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${
                errors.address ? 'border-rose-400 focus:border-rose-400' : 'border-slate-300 focus:border-slate-500'
              }`}
            />
            {errors.address && <p className='text-rose-400 text-sm mt-1'>Vui lòng nhập số nhà, tên đường</p>}
          </div>
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

      {/* Shipping calculation info */}
      {isCalculatingShipping && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4'>
          <p className='text-blue-800 text-sm'>🔄 Đang tính phí vận chuyển...</p>
        </div>
      )}

      {/* Shipping breakdown info */}
      {shippingBreakdown && (
        <div
          className={`border rounded-lg p-3 mb-4 ${
            shippingBreakdown.isFreeShipping ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
          }`}
        >
          <p
            className={`text-sm font-medium mb-2 ${
              shippingBreakdown.isFreeShipping ? 'text-green-800' : 'text-blue-800'
            }`}
          >
            {shippingBreakdown.isFreeShipping ? 'Miễn phí vận chuyển!' : 'Thông tin vận chuyển:'}
          </p>
          <div className={`text-xs space-y-1 ${shippingBreakdown.isFreeShipping ? 'text-green-700' : 'text-blue-700'}`}>
            <p>• Khoảng cách: ~{shippingBreakdown.distance}km</p>
            {shippingBreakdown.isFreeShipping ? (
              <p>• Đơn hàng đủ điều kiện freeship (từ {formatPrice(shippingBreakdown.freeShippingThreshold)})</p>
            ) : (
              <>
                <p>• Phí cơ bản: {formatPrice(shippingBreakdown.baseShipping)}</p>
                {shippingBreakdown.distanceFee > 0 && (
                  <p>• Phí khoảng cách: {formatPrice(shippingBreakdown.distanceFee)}</p>
                )}
                <p className='text-orange-600 font-medium'>
                  💡 Mua thêm {formatPrice(shippingBreakdown.freeShippingThreshold - cartTotalAmount)} để được freeship!
                </p>
              </>
            )}
          </div>
        </div>
      )}

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
