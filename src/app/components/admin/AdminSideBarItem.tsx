import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconType } from 'react-icons';

interface AdminSideBarItemProps {
	label: string;
	icon?: IconType;
	path?: string;
}

const AdminSideBarItem: React.FC<AdminSideBarItemProps> = ({ label, icon: Icon, path }) => {
	const pathName = usePathname();
	if (typeof path === 'undefined') return null;
	return (
		<Link
			href={path}
			className={`p-4 w-full flex justify-stretch items-center gap-2 rounded-xl ${
				pathName === path ? 'bg-slate-500 text-white' : 'hover:bg-slate-500 hover:text-white'
			}`}
		>
			{Icon && <Icon size={20} />}

			<span>{label}</span>
		</Link>
	);
};

export default AdminSideBarItem;
