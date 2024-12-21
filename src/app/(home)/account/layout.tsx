import { getCurrentUser } from '@/app/actions/getCurrentUser';
import AccountSideBar from '@/app/components/account/AccountSideBar';
export const metadata = {
	title: 'ThanhHuy Store - Tài khoản',
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
	const currentUser = await getCurrentUser();
	return (
		<div className="flex flex-col gap-6 lg:gap-0 lg:flex-row max-w-[1200px] mx-auto mt-5">
			<div className="w-full lg:w-[28%] mx-10 lg:mx-0 bg-slate-200 rounded-md">
				<AccountSideBar currentUser={currentUser} />
			</div>
			<div className="w-full lg:w-[72%] mx-10 lg:mx-4 py-0 rounded-md bg-white">{children}</div>
		</div>
	);
}
