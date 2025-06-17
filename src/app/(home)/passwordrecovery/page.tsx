import FormWarp from '@/app/components/FormWrap';
import PasswordRecoveryForm from './PasswordRecoveryForm';
import Image from 'next/image';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const PasswordRecovery = () => {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <div className='flex mx-auto justify-center items-center gap-24 mt-10'>
        <div className='hidden xl:block w-[700px] h-[500px]'>
          <Image src='/recovery_pw.jpeg' alt='recoveryPassword' width={700} height={500} />
        </div>

        <FormWarp custom='w-[500px]'>
          <PasswordRecoveryForm />
        </FormWarp>
      </div>
    </Suspense>
  );
};

export default PasswordRecovery;
