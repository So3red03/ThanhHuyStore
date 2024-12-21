import Container from '@/app/components/Container';
import ManageUserClient from './ManageUserClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getUsers } from '@/app/actions/getUsers';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const ManageUsers = async () => {
	const currentUser = await getCurrentUser();
	const users = await getUsers();
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Container custom="!p-0">
				<ManageUserClient users={users} currentUser={currentUser} />
			</Container>
		</Suspense>
	);
};

export default ManageUsers;
