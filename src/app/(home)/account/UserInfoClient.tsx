'use client';
import Button from '@/app/components/Button';
import { useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { SafeUser } from '../../../../types';
import AdminModal from '@/app/components/admin/AdminModal';
import toast from 'react-hot-toast';
import Image from 'next/image';
import axios from 'axios';
import { auth } from '@/app/libs/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { formatDate, formatDateNoTime } from './orders/OrdersClient';
import { useRouter } from 'next/navigation';
import firebase from '@/app/libs/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

interface UserInfoClientProps {
  currentUser: SafeUser | null | undefined;
}

// Đăng nhập bằng gg thì email không thay đổi được
const UserInfoClient: React.FC<UserInfoClientProps> = ({ currentUser }) => {
  const [userInfo, setUserInfo] = useState(currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300);
  const [userImage, setUserImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  let timerId: any;
  // Không cần dùng defaultValues nếu dùng register và có thể gây ra xung đột nếu có dữ liệu mặc định với useForm
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors }
  } = useForm<FieldValues>();

  useEffect(() => {
    if (currentUser) {
      setUserInfo(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && remainingTime > 0) {
      timerId = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId); // Dọn dẹp timer khi component unmount
  }, [isOpen, remainingTime]);

  // Upload image to Firebase
  const uploadImageToFirebase = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(firebase);
      const fileName = new Date().getTime() + '-' + imageFile.name;
      const storageRef = ref(storage, `users/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        error => {
          console.error('Lỗi khi tải ảnh lên Firebase:', error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then(downloadURL => {
              console.log('Tải ảnh thành công: ', downloadURL);
              resolve(downloadURL);
            })
            .catch(error => {
              console.error('Lỗi khi lấy download URL:', error);
              reject(error);
            });
        }
      );
    });
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    try {
      let newImageUrl = userInfo?.image; // Sử dụng ảnh hiện tại làm mặc định

      // Nếu có ảnh mới được chọn, upload lên Firebase
      if (userImage) {
        toast.loading('Đang tải ảnh lên...', { id: 'upload' });
        newImageUrl = await uploadImageToFirebase(userImage);
        toast.success('Tải ảnh thành công!', { id: 'upload' });
        console.log('Ảnh đã được tải lên thành công:', newImageUrl);
      }

      // Cập nhật thông tin user với ảnh mới (nếu có)
      const updateData = {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        image: newImageUrl
      };

      toast.loading('Đang cập nhật thông tin...', { id: 'update' });
      await axios.put('/api/user', updateData);

      // Cập nhật state local
      if (userInfo) {
        setUserInfo({
          ...userInfo,
          name: updateData.name,
          phoneNumber: updateData.phone,
          image: updateData.image || null
        });
      }

      toast.success('Cập nhật thông tin thành công!', { id: 'update' });
      router.refresh();
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      toast.error('Có lỗi khi cập nhật thông tin', { id: 'update' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    const phone = getValues('phone');
    // Kiểm tra định dạng số điện thoại (10 chữ số và bắt đầu bằng 0)
    const phoneRegex = /^0\d{9}$/;
    if (phoneRegex.test(phone)) {
      setIsOpen(!isOpen);
    }
  };

  const formatTime = (seconds: any) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleInputChange = (e: any, index: any) => {
    const value = e.target.value;

    // Chỉ cho phép nhập số
    if (/^[0-9]$/.test(value)) {
      setValue(`otp[${index}]`, value); // Ghi giá trị vào trường
      if (index < 5) {
        // Chuyển focus sang trường tiếp theo
        document.getElementsByName(`otp[${index + 1}]`)[0].focus();
      }
    }
  };

  // function onCaptchVerify() {
  // 	if (!window.recaptchaVerifier) {
  // 		window.recaptchaVerifier = new RecaptchaVerifier(
  // 			'recaptcha-container',
  // 			{
  // 				size: 'invisible',
  // 				callback: (response: any) => {
  // 					onSignup();
  // 				},
  // 				'expired-callback': () => {},
  // 			},
  // 			auth
  // 		);
  // 	}
  // }

  // function onSignup() {
  // 	setIsLoading(true);
  // 	onCaptchVerify();

  // 	const appVerifier = window.recaptchaVerifier;

  // 	const formatPh = '+' + ph;

  // 	signInWithPhoneNumber(auth, formatPh, appVerifier)
  // 		.then((confirmationResult) => {
  // 			window.confirmationResult = confirmationResult;
  // 			setIsLoading(false);
  // 			setShowOTP(true);
  // 			toast.success('OTP sended successfully!');
  // 		})
  // 		.catch((error) => {
  // 			console.log(error);
  // 			setIsLoading(false);
  // 		});
  // }

  // function onOTPVerify() {
  // 	setIsLoading(true);
  // 	window.confirmationResult
  // 		.confirm(otp)
  // 		.then(async (res: any) => {
  // 			console.log(res);
  // 			setUser(res.user);
  // 			setIsLoading(false);
  // 		})
  // 		.catch((err: any) => {
  // 			console.log(err);
  // 			setIsLoading(false);
  // 		});
  // }

  // Đối với state thay đổi liên tục nên dùng value do automatic
  if (!currentUser) {
    router.push('/');
    return;
  }

  return (
    <>
      <div className='flex gap-8 max-w-4xl px-6'>
        {/* Left side - Form */}
        <div className='flex-1'>
          <h1 className='text-2xl font-bold mb-4'>THÔNG TIN TÀI KHOẢN</h1>

          <div className='mb-4 flex justify-stretch items-center w-full'>
            <label className='text-gray-700 font-medium w-[26%]'>Họ Tên</label>
            <input
              {...register('name', { required: true })}
              required
              type='text'
              //@ts-ignore
              defaultValue={userInfo?.name}
              disabled={isLoading}
              className={`border border-gray-300 focus:outline-none focus:ring-1
								focus:ring-gray-400 rounded-md p-2 w-[74%] ${errors.name ? 'border-red-500' : ''}`}
            />
            {/* {errors.name && <p className="text-red-500 text-sm">Họ Tên không được để trống</p>} */}
          </div>

          <div className='mb-4 flex items-center justify-stretch w-full'>
            <label className='text-start text-gray-700 font-medium w-[26%]'>Giới tính</label>
            <div className='flex gap-4'>
              <label className='flex items-center'>
                <input {...register('gender', { required: true })} disabled={isLoading} type='radio' value='true' />
                <span className='ml-2'>Nam</span>
              </label>
              <label className='flex items-center'>
                <input {...register('gender', { required: true })} disabled={isLoading} type='radio' value='false' />
                <span className='ml-2'>Nữ</span>
              </label>
            </div>
            {errors.gender && <p className='text-red-500 ml-5 text-sm'>Giới tính không được để trống</p>}
          </div>

          <div className='mb-4 flex justify-stretch items-center w-full'>
            <label className='text-start text-gray-700 font-medium w-[26%]'>Số điện thoại</label>
            <div className='flex justify-between items-center w-[74%] gap-x-3'>
              <input
                {...register('phone', { required: true })}
                required
                //@ts-ignore
                defaultValue={userInfo?.phoneNumber}
                disabled={isLoading}
                type='text'
                className={`border border-gray-300 focus:outline-none focus:ring-1
									 focus:ring-gray-400 rounded-md p-2 flex-1 ${errors.phone ? 'border-red-500' : ''}`}
              />
              {/* <a onClick={toggleOpen} className="text-blue-600 underline text-base hover:cursor-pointer">
							Xác thực
						</a> */}
            </div>
          </div>

          <div className='mb-4 flex justify-stretch items-center w-full'>
            <label className='text-start text-gray-700 font-medium w-[26%]'>Email</label>
            <input
              {...register('email')}
              required
              disabled={isLoading}
              value={userInfo?.email}
              readOnly
              type='text'
              className={`border border-gray-300 focus:cursor-not-allowed hover:cursor-not-allowed focus:outline-none focus:ring-1
								 focus:ring-gray-400 w-[74%] rounded-md p-2`}
            />
          </div>

          <div className='mb-4 flex justify-stretch items-center w-full'>
            <label className='text-start text-gray-700 font-medium w-[26%]'>Ngày sinh</label>
            <input
              {...register('dateOfBirth', { required: true })}
              required
              disabled={isLoading}
              type='date'
              className={`border border-gray-300 focus:outline-none focus:ring-1
								 focus:ring-gray-400 w-[74%] rounded-md p-2 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
            />
            {/* {(errors.dateOfBirth) && (
					<p className="text-red-500 text-sm ml-3">Vui lòng chọn đầy đủ Ngày/Tháng/Năm sinh.</p>
					)} */}
          </div>
          <div className='mb-4 flex justify-stretch items-center w-full'>
            <label className='text-gray-700 font-medium w-[26%]'>Ngày tham gia</label>
            <input
              disabled={isLoading}
              value={formatDateNoTime(userInfo?.createAt)}
              readOnly
              type='text'
              className={`border-none focus:outline-none w-[74%] rounded-md p-2`}
            />
          </div>
          <div className='w-full flex'>
            <div className='w-[26%]'></div>
            <Button
              label='LƯU THAY ĐỔI'
              custom='!w-[150px] !text-sm !font-semibold !py-2 !px-1 !bg-slate-500 hover:!bg-slate-600'
              onClick={handleSubmit(onSubmit)}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right side - Image Upload */}
        <div className='w-80'>
          <div className='flex flex-col items-center space-y-4'>
            {/* Current/Preview Image */}
            <div className='relative'>
              <Image
                src={imagePreview || userInfo?.image || '/no-avatar-2.jpg'}
                alt='Avatar'
                width={200}
                height={200}
                className='rounded-full object-cover border-4 border-gray-200'
              />
            </div>

            {/* Upload Button */}
            <div className='flex flex-col items-center space-y-2'>
              <input type='file' accept='image/*' onChange={handleImageChange} className='hidden' id='avatar-upload' />
              <label
                htmlFor='avatar-upload'
                className='cursor-pointer bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium'
              >
                Chọn ảnh mới
              </label>
              <p className='text-sm text-gray-500 text-center'>
                Chọn ảnh JPG, PNG hoặc GIF
                <br />
                Kích thước tối đa: 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
          <div className='text-center p-6 px-0'>
            <div className='flex justify-between px-4 pb-3 border-b border-gray-300'>
              <h2 className='text-xl font-semibold mb-4'>Xác thực OTP</h2>
              <span className='text-4xl hover:cursor-pointer' onClick={toggleOpen}>
                &times;
              </span>
            </div>
            <Image
              src='https://file.hstatic.net/200000636033/file/otp-img_0df06c560ef74032a3434244e9dd7b93.png'
              alt='OTP'
              width={180}
              height={180}
              className='mx-auto mb-4 mt-5'
            />
            <p className='mb-4'>
              Mã xác thực OTP đã được gửi đến số điện thoại <strong>{userInfo?.phoneNumber}</strong>
              <br />
              có hiệu lực trong {formatTime(remainingTime)}
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className='mb-4 mx-auto'>
              <div className='flex justify-center space-x-2 mb-4'>
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    autoComplete='off'
                    {...register(`otp[${index}]`, { required: true, pattern: /^[0-9]$/ })}
                    type='text'
                    maxLength={1}
                    onChange={e => handleInputChange(e, index)}
                    className='w-10 h-10 text-center border border-gray-300 rounded focus:outline-none focus:ring-1
											 focus:ring-blue-500'
                    onFocus={e => e.target.select()}
                  />
                ))}
              </div>
              <div className='flex justify-center'>
                <Button label='XÁC NHẬN' custom='!w-[150px]' onClick={() => {}} />
              </div>
            </form>
            <button
              onClick={() => toast.success('Đã gửi lại mã OTP')}
              className='bg-transparent border-none text-blue-500 cursor-pointer hover:underline'
            >
              Gửi lại mã OTP
            </button>
          </div>
        </AdminModal>
      )}
    </>
  );
};

export default UserInfoClient;
