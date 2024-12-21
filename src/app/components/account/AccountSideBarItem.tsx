import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconType } from 'react-icons';

interface AccountSideBarItemProps {
	label: string;
	icon: IconType;
	path: string;
}

const AccountSideBarItem: React.FC<AccountSideBarItemProps> = ({ label, icon: Icon, path }) => {
	const pathName = usePathname();
	const isActive = path !== '/account' && pathName?.startsWith(path);
	const labelCheck = label === 'Tổng quan' ? true : false;
	return (
		<Link
			href={path}
			className={`p-4 w-full text-slate-700 flex justify-stretch items-center gap-2 rounded-xl ${
				labelCheck ? 'ml-0' : 'ml-0'
			} ${pathName === path || isActive ? 'bg-slate-500 text-white' : 'hover:bg-slate-500 hover:text-white'}`}
		>
			<Icon size={20} />
			<span>{label}</span>
		</Link>
	);
};

export default AccountSideBarItem;
