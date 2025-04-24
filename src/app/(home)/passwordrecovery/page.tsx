import FormWarp from '@/app/components/FormWrap';
import PasswordRecoveryForm from './PasswordRecoveryForm';
import Image from 'next/image';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const PasswordRecovery = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<div className="flex mx-auto justify-center items-center gap-24 mt-10">
				<div className="hidden xl:block w-[700px] h-[500px]">
					<Image src="/recovery_pw.jpeg" alt="recoveryPassword" width={700} height={500} />
				</div>

				<FormWarp custom="w-[500px]">
					<PasswordRecoveryForm />
				</FormWarp>
			</div>
		</Suspense>
	);
};

export default PasswordRecovery;
