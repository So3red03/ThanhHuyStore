import { CiRead, CiUser, CiViewList } from 'react-icons/ci';

export const AccountItems = [
	{
		title: 'Thông tin tài khoản',
		path: '/account',
		icon: CiUser,
	},
	{
		title: 'Quản lý đơn hàng',
		path: '/account/orders',
		icon: CiViewList,
	},
	{
		title: 'Sản phẩm đã xem',
		path: '/account/viewed',
		icon: CiRead,
	},
];
