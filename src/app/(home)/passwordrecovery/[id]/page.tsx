import FormWarp from '@/app/components/FormWrap';
import PasswordResetForm from './PasswordResetForm';
import Image from 'next/image';
import NotFound from '../../404';

const PasswordReset = ({ params }: { params: { id: string } }) => {
	if (!params.id) {
		return <NotFound />;
	}
	return (
		<div className="flex mx-auto justify-center items-center gap-24 mt-10">
			<div className="hidden xl:block w-[700px] h-[500px]">
				<Image src="/reset_pw.png" alt="resetPassword" width={700} height={500} />
			</div>

			<FormWarp custom="w-[500px]">
				<PasswordResetForm userId={params.id} />
			</FormWarp>
		</div>
	);
};

export default PasswordReset;
