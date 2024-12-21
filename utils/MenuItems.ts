import {
	MdCategory,
	MdChat,
	MdCropOriginal,
	MdDashboard,
	MdDns,
	MdFormatListBulleted,
	MdOutlineChat,
	MdOutlineContentPasteSearch,
	MdOutlineDeveloperBoard,
	MdOutlineFeed,
	MdOutlineGridView,
	MdOutlineHome,
	MdSupervisedUserCircle,
} from 'react-icons/md';
import { BiCategory, BiNews, BiSolidCategory } from 'react-icons/bi';
import { CiViewList } from 'react-icons/ci';

export const MenuItems = [
	{
		title: 'Chung',
		dashboardItem: {
			title: 'Dashboards',
			icon: MdOutlineHome,
			list: [
				{
					title: 'Bán hàng',
					path: '/admin',
				},
				{
					title: 'Tin tức',
					path: '/admin/news-dashboard',
				},
			],
		},
	},
	{
		title: 'Danh mục',
		subItem: {
			title: 'Quản lý',
			icon: MdOutlineContentPasteSearch,
			list: [
				{
					title: 'Sản phẩm',
					icon: MdFormatListBulleted,
					list: [
						{
							title: 'Danh sách',
							path: '/admin/manage-products',
						},
						{
							title: 'Danh mục',
							path: '/admin/manage-categories',
						},
					],
				},
				{
					title: 'Người dùng',
					icon: MdSupervisedUserCircle,
					list: [
						{
							title: 'Danh sách',
							path: '/admin/manage-users',
						},
					],
				},
				{
					title: 'Bài viết',
					icon: BiNews,
					list: [
						{
							title: 'Danh sách',
							path: '/admin/manage-articles',
						},
						{
							title: 'Danh mục',
							path: '/admin/manage-articlesCategory',
						},
					],
				},
				{
					title: 'Đơn hàng',
					path: '/admin/manage-orders',
					icon: MdOutlineFeed,
				},
				{
					title: 'Slide',
					path: '/admin/manage-banner',
					icon: MdCropOriginal,
				},
				{
					title: 'Tin nhắn',
					path: '/admin/chat',
					icon: MdOutlineChat,
				},
			],
		},
	},
	{
		title: 'Cài đặt',
		list: [
			// {
			// 	title: 'Settings',
			// 	path: '/dashboard/settings',
			// 	icon: MdOutlineSettings,
			// },
			// {
			// 	title: 'Help',
			// 	path: '/dashboard/help',
			// 	icon: MdHelpCenter,
			// },
			// {
		],
	},
];
