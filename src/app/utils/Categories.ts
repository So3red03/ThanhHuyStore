import { AiOutlineLaptop } from 'react-icons/ai';
import { MdOutlineKeyboard, MdStorefront, MdWatch } from 'react-icons/md';
import { TbDeviceAirpodsCase, TbDeviceIpadHorizontal } from 'react-icons/tb';
import { SlScreenSmartphone } from 'react-icons/sl';
import { BiNews } from 'react-icons/bi';
import { LiaApple } from 'react-icons/lia';

export const categories = [
	{
		label: 'Tất cả',
		value: 'All',
		icon: MdStorefront,
	},
	{
		label: 'iPhone',
		value: 'iPhone',
		icon: SlScreenSmartphone,
		subItemsImg:
			'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/store-card-13-iphone-nav-202409?wid=400&hei=260&fmt=png-alpha&.v=1723857138230',
		subItems: [
			'iPhone 16 series',
			'iPhone 15 series',
			'iPhone 14 series',
			'iPhone 13 series',
			'iPhone 12 series',
			'iPhone 11 series',
			'iPhone SE',
		],
	},
	{
		label: 'Mac',
		value: 'Mac',
		icon: AiOutlineLaptop,
		subItemsImg:
			'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/store-card-13-mac-nav-202410?wid=400&hei=260&fmt=png-alpha&.v=1728342368663',
		subItems: ['MacBook Pro', 'MacBook Air', 'iMac (24 inch) - Chip M3'],
	},
	{
		label: 'iPad',
		value: 'iPad',
		icon: TbDeviceIpadHorizontal,
		subItemsImg:
			'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/ipad-card-40-pro-202405?wid=680&hei=528&fmt=p-jpg&qlt=95&.v=1713920820026',
		subItems: [
			'iPad Air M2',
			'iPad Pro M4',
			'iPad Pro',
			'iPad Air',
			'iPad (Gen 10th)',
			'iPad (Gen 9th)',
			'iPad mini',
		],
	},
	{
		label: 'Airpods',
		value: 'Airpods',
		icon: TbDeviceAirpodsCase,
		subItemsImg:
			'https://www.apple.com/v/airpods/shared/compare/e/images/compare/compare_airpods_pro_2__c3r137ebxwae_large.png',
		subItems: ['AirPods 4', 'AirPods Max 2024', 'AirPods Pro'],
	},
	{
		label: 'Apple Watch',
		value: 'Watch',
		icon: MdWatch,
		subItemsImg: 'https://static.id.gtech.asia/prod/100035/20240930/0B5792611B38F50344AA618E45953B91.png',
		subItems: [
			'Apple Watch Series 10',
			'Apple Watch Ultra 2024',
			'Apple Watch SE 2024',
			'Apple Watch Series 9',
			'Apple Watch Ultra 2',
			'Apple Watch Series 8',
			'Apple Watch Ultra',
			'Apple Watch Series 7',
			'Apple Watch SE',
		],
	},
	{
		label: 'Phụ kiện',
		value: 'Accessories',
		icon: MdOutlineKeyboard,
		subItemsImg: 'https://static.id.gtech.asia/prod/100035/20220408/CAD164C13E29BFD39D661A6FD232FDC7.png',
		subItems: [
			'Phụ kiện iPhone',
			'Phụ kiện MacBook',
			'Phụ kiện iPad',
			'Phụ kiện Apple Watch',
			'Airtags',
			'Bàn phím & Bút',
			'Magic Mouse',
		],
	},
	{
		label: 'Tin tức',
		value: 'News',
		icon: BiNews,
	},
	{
		label: 'Tìm hiểu thêm về Iphone',
		value: 'Comparison',
		icon: LiaApple,
	},
];
