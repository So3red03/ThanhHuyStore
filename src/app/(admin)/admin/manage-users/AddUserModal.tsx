'use client';

import React, { useState } from 'react';
import { useForm, FieldValues, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import AdminModal from '@/app/components/admin/AdminModal';
import FormWarp from '@/app/components/FormWrap';
import Heading from '@/app/components/Heading';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';

interface AddUserModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, toggleOpen }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'USER',
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);

    try {
      const response = await axios.post('/api/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (response.status === 200) {
        toast.success('Thêm người dùng thành công!');
        reset();
        toggleOpen();
        router.refresh();
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Email đã tồn tại!');
      } else {
        toast.error('Có lỗi xảy ra khi thêm người dùng!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'USER', label: 'Người dùng' },
    { value: 'ADMIN', label: 'Quản trị viên' },
  ];

  return (
    <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
      <FormWarp custom="!pt-1">
        <Heading title="Thêm người dùng mới" center>
          <></>
        </Heading>

        <Input
          id="name"
          label="Họ và tên"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />

        <Input
          id="email"
          label="Email"
          type="email"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />

        <Input
          id="password"
          label="Mật khẩu"
          type="password"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />

        <Input
          id="role"
          label="Vai trò"
          type="combobox"
          disabled={isLoading}
          register={register}
          errors={errors}
          options={roleOptions}
          required
        />

        <Button
          label="Thêm người dùng"
          isLoading={isLoading}
          onClick={handleSubmit(onSubmit)}
        />
      </FormWarp>
    </AdminModal>
  );
};

export default AddUserModal;
