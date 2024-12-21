import { Suspense } from 'react';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import RegisterForm from './RegisterForm';

export const dynamic = 'force-dynamic';

const Register = async () => {
	const currentUser = await getCurrentUser();

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<RegisterForm currentUser={currentUser} />
		</Suspense>
	);
};

export default Register;
