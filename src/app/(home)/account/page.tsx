import { getCurrentUser } from '@/app/actions/getCurrentUser';
import UserInfoClient from './UserInfoClient';
import { Suspense } from 'react';
export const dynamic = 'force-dynamic';
const profile = async () => {
	const currentUser = await getCurrentUser();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<UserInfoClient currentUser={currentUser} />
		</Suspense>
	);
};

export default profile;
