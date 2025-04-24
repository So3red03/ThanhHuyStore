'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const Banner = () => {
	const banners = {
		iphone: 'iphone.jpeg',
		mac: 'mac.jpeg',
		watch: 'watch.jpeg',
		airpods: 'airpods.jpeg',
		ipad: 'ipad.jpeg',
		'phu-kien': 'phukien.png'
	};

	const [currentBanner, setCurrentBanner] = useState('');
	const pathname = usePathname();
	useEffect(() => {
		// Lấy key từ URL
		const key = pathname?.split('/')[1];
		//@ts-ignore
		if (banners[key]) {
			//@ts-ignore
			setCurrentBanner(banners[key]);
		}
	}, [pathname]);
    if (!currentBanner) {
        return null;
    }
	return (
		<div className="w-full h-[70vh] mx-auto relative group mb-8">
			<div
				style={{ backgroundImage: `url(${currentBanner})` }}
				className="w-full h-full bg-center bg-cover duration-500"
			/>
		</div>
	);
};

export default Banner;
