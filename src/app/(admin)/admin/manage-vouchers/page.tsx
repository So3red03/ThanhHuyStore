import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getVouchers } from '@/app/actions/getVouchers';
import { getUsers } from '@/app/actions/getUsers';
import ManageVouchersClient from './ManageVouchersClient';
import NullData from '@/app/components/NullData';

const ManageVouchers = async () => {
	const currentUser = await getCurrentUser();
	const vouchers = await getVouchers();
	const users = await getUsers();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return <NullData title="Oops! Access denied" />;
	}

	return (
		<div className="pt-8">
			<ManageVouchersClient 
				vouchers={vouchers} 
				users={users}
				currentUser={currentUser} 
			/>
		</div>
	);
};

export default ManageVouchers;
