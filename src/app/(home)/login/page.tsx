import { getCurrentUser } from '@/app/actions/getCurrentUser';
import LoginForm from './LoginForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const Login = async () => {
	const currentUser = await getCurrentUser();

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LoginForm currentUser={currentUser} />
		</Suspense>
	);
};

export default Login;
