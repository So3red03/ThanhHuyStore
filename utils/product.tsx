//image links from firebase to amazon, firebase has issues with these direct links. Add the amazon link instead of firebase at the cofig
export const products = [
	{
		id: '64a654593e91b8e73a351e9b',
		name: 'iPhone 14',
		description:
			'iPhone 14. Bắt trọn chi tiết ấn tượng với Camera Chính 48MP. Trải nghiệm iPhone theo cách hoàn toàn mới với Dynamic Island và màn hình Luôn Bật. Phát Hiện Va Chạm,1 một tính năng an toàn mới, thay bạn gọi trợ giúp khi cần kíp.',
		// price: 17390000,
		price: 699,
		brand: 'apple',
		category: 'Phone',
		inStock: true,
		images: [
			{
				color: 'White',
				colorCode: '#FFFFFF',
				image: 'https://m.media-amazon.com/images/I/71p-tHQ0u1L._AC_SX679_.jpg',
			},
			{
				color: 'Gray',
				colorCode: '#808080',
				image: 'https://m.media-amazon.com/images/I/417tEj3iJ8L._AC_.jpg',
			},
		],
		reviews: [],
	},
	{
		id: '64a4ebe300900d44bb50628a',
		name: 'Macbook Pro 13 inch',
		// name: 'Macbook Pro 13 inch: M2 chip with 8-core CPU and 10-core GPU, 256GB SSD',
		description:
			'Macbook Pro 13 inch nay đa năng hơn bao giờ hết. Siêu mạnh mẽ với chip M2 thế hệ tiếp theo, đây là chiếc máy tính xách tay chuyên nghiệp nhỏ gọn nhất của Apple, cùng thời lượng pin lên đến 20 giờ.',
		// price: 30190000,
		price: 1599,
		brand: 'apple',
		category: 'Laptop',
		inStock: true,
		images: [
			{
				color: 'Black',
				colorCode: '#000000',
				image: '/productImg/macs/mbp14-spacegray-select-202301_1_1.jpg',
			},
		],
		reviews: [
			{
				id: '64a65a6158b470c6e06959ee',
				userId: '6475af156bad4917456e6e1e',
				productId: '64a4ebe300900d44bb50628a',
				rating: 5,
				comment: 'good',
				createdDate: '2023-07-06T06:08:33.067Z',
				user: {
					id: '6475af156bad4917456e6e1e',
					name: 'Charles',
					email: 'example@gmail.com',
					emailVerified: null,
					image: 'https://lh3.googleusercontent.com/a/AAcHTteOiCtILLBWiAoolIW9PJH-r5825pBDl824_8LD=s96-c',
					hashedPassword: null,
					createdAt: '2023-05-30T08:08:53.979Z',
					updatedAt: '2023-05-30T08:08:53.979Z',
					role: 'ADMIN',
				},
			},
		],
	},
	{
		id: '648437b38c44d52b9542e340',
		name: 'iPhone 13',
		description:
			'The product is refurbished, fully functional, and in excellent condition. Backed by the 90-day E~Shop Renewed Guarantee.\n- This pre-owned product has been professionally inspected, tested and cleaned by Amazon qualified vendors. It is not certified by Apple.\n- This product is in "Excellent condition". The screen and body show no signs of cosmetic damage visible from 12 inches away.\n- This product will have a battery that exceeds 80% capacity relative to new.\n- Accessories may not be original, but will be compatible and fully functional. Product may come in generic box.\n- Product will come with a SIM removal tool, a charger and a charging cable. Headphone and SIM card are not included.\n- This product is eligible for a replacement or refund within 90-day of receipt if it does not work as expected.\n- Refurbished phones are not guaranteed to be waterproof.',
		// price: 13890000,
		price: 599,
		brand: 'Apple',
		category: 'Phone',
		inStock: true,
		images: [
			{
				color: 'Black',
				colorCode: '#000000',
				image: 'https://m.media-amazon.com/images/I/61g+McQpg7L._AC_SX679_.jpg',
			},
			{
				color: 'Blue',
				colorCode: '#276787',
				image: 'https://m.media-amazon.com/images/I/713Om9vCHUL._AC_SX679_.jpg',
			},
			{
				color: 'Red',
				colorCode: '#bf0013',
				image: 'https://m.media-amazon.com/images/I/61thdjmfHcL.__AC_SX300_SY300_QL70_FMwebp_.jpg',
			},
		],
		reviews: [
			{
				id: '6499b4887402b0efd394d8f3',
				userId: '6499b184b0e9a8c8709821d3',
				productId: '648437b38c44d52b9542e340',
				rating: 4,
				comment: 'good enough. I like the camera and casing. the delivery was fast too.',
				createdDate: '2023-06-26T15:53:44.483Z',
				user: {
					id: '6499b184b0e9a8c8709821d3',
					name: 'Chaoo',
					email: 'example1@gmail.com',
					emailVerified: null,
					image: 'https://lh3.googleusercontent.com/a/AAcHTtcuRLwWi1vPKaQOcJlUurlhRAIIq2LgYccE8p32=s96-c',
					hashedPassword: null,
					createdAt: '2023-06-26T15:40:52.558Z',
					updatedAt: '2023-06-26T15:40:52.558Z',
					role: 'USER',
				},
			},
			{
				id: '6499a110efe4e4de451c7edc',
				userId: '6475af156bad4917456e6e1e',
				productId: '648437b38c44d52b9542e340',
				rating: 5,
				comment: 'I really liked it!!',
				createdDate: '2023-06-26T14:30:40.998Z',
				user: {
					id: '6475af156bad4917456e6e1e',
					name: 'Charles',
					email: 'example@gmail.com',
					emailVerified: null,
					image: 'https://lh3.googleusercontent.com/a/AAcHTteOiCtILLBWiAoolIW9PJH-r5825pBDl824_8LD=s96-c',
					hashedPassword: null,
					createdAt: '2023-05-30T08:08:53.979Z',
					updatedAt: '2023-05-30T08:08:53.979Z',
					role: 'ADMIN',
				},
			},
		],
	},
	{
		id: '64a4e9e77e7299078334019f',
		name: 'AirPods (3rd generation) with Lightning Charging Case',
		description:
			'Cross computer control: Game changing capacity to navigate seamlessly on 3 computers, and copy paste text, images, and files from 1 to the other using Logitech flow\nDual connectivity: Use with upto 3 Windows or Mac computers via included Unifying receiver or Bluetooth Smart wireless technology. Gesture button- Yes',
		// price: 4090000,
		price: 179,
		brand: 'logitech',
		category: 'Accesories',
		inStock: true,
		images: [
			{
				color: 'White',
				colorCode: '#FFFFFF',
				image: '/productImg/airpods/airpods_white.jpeg',
			},
		],
		reviews: [],
	},
	{
		id: '649d775128b6744f0f497040',
		name: 'iPad Air 10.9-inch Wi-Fi 64GB',
		description:
			'iPad Air. Với màn hình Liquid Retina 10.9 inch sống động. Chip Apple M1 đột phá cho hiệu năng nhanh hơn, giúp iPad Air trở nên siêu mạnh mẽ để sáng tạo và chơi game di động. Sở hữu Touch ID, camera tiên tiến, 5G và Wi-Fi 6 nhanh như chớp, cổng USB-C, cùng khả năng hỗ trợ Magic Keyboard và Apple Pencil (thế hệ thứ 2).',
		// price: 14190000,
		price: 349,
		brand: 'Apple',
		category: 'iPad',
		inStock: true,
		images: [
			{
				color: 'Gray',
				colorCode: '#C0C0C0',
				image: '/productImg/ipads/ipad-air-5-wifi-blue-650x650-1.png',
			},
			{
				color: 'Blue',
				colorCode: '#276787',
				image: '/productImg/ipads/ipad-air-5-m1-wifi-gray-thumb-650x650-1.png',
			},
		],
		reviews: [],
	},

	//test
	// {
	// 	id: '649d775128b6744f0f497404',
	// 	name: 'Smart Watch Pro(Answer/Make Call), 1.85" Smartwatch for Men Women IP68 Waterproof, 100+ Sport Modes, Fitness Activity Tracker, Heart Rate Sleep Monitor, Pedometer, Smart Watches for Android iOS, 2023',
	// 	description:
	// 		'Bluetooth Call and Message Reminder: The smart watch is equipped with HD speaker, after connecting to your phone via Bluetooth, you can directly use the smartwatches to answer or make calls, read messages, store contacts, view call history. The smartwatch can set up more message notifications in "GloryFit" APP. You will never miss any calls and messages during meetings, workout and riding.',
	// 	price: 70,
	// 	brand: 'Nerunsa',
	// 	category: 'Watch',
	// 	inStock: true,
	// 	images: [
	// 		{
	// 			color: 'Black',
	// 			colorCode: '#000000',
	// 			image: 'https://m.media-amazon.com/images/I/71s4mjiit3L.__AC_SX300_SY300_QL70_FMwebp_.jpg',
	// 		},
	// 		{
	// 			color: 'Silver',
	// 			colorCode: '#C0C0C0',
	// 			image: 'https://m.media-amazon.com/images/I/71zbWSRMaYL.__AC_SX300_SY300_QL70_FMwebp_.jpg',
	// 		},
	// 	],
	// 	reviews: [],
	// },
];
