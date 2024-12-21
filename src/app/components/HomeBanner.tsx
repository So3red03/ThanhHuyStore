'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BsChevronCompactLeft, BsChevronCompactRight } from 'react-icons/bs';
import { MdCircle } from 'react-icons/md';

interface HomeBannerProps {
	bannerData: any;
}

export const HomeBanner: React.FC<HomeBannerProps> = ({ bannerData }) => {
	const searchParams = useSearchParams(); // Hook để lấy query params
	const searchTerm = searchParams?.get('searchTerm'); // Lấy giá trị của 'searchTerm'
	const category = searchParams?.get('category');
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentSlides, setCurrentSlides] = useState(bannerData.map((b: any) => b.image));

	const prevSlide = () => {
		const isFirstSlide = currentIndex === 0;
		const newIndex = isFirstSlide ? bannerData.length - 1 : currentIndex - 1;
		setCurrentIndex(newIndex);
	};

	const nextSlide = () => {
		const isLastSlide = currentIndex === bannerData.length - 1;
		const newIndex = isLastSlide ? 0 : currentIndex + 1;
		setCurrentIndex(newIndex);
	};

	const goToSlide = (slideIndex: any) => {
		setCurrentIndex(slideIndex);
	};

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768) {
				setCurrentSlides(bannerData.map((b: any) => b.imageResponsive));
			} else {
				setCurrentSlides(bannerData.map((b: any) => b.image));
			}
		};

		handleResize();

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	useEffect(() => {
		const intervalId = setInterval(nextSlide, 2500);

		return () => {
			clearInterval(intervalId);
		};
	}, [currentIndex]);

	if (searchTerm || category) {
		return null;
	}
	return (
		<div className="w-full h-[70vh] mx-auto relative group mb-8">
			<div
				style={{ backgroundImage: `url(${currentSlides[currentIndex]})` }}
				className="w-full h-full bg-center bg-cover duration-500 "
			></div>
			{/* Left Arrow */}
			<div className="hidden group-hover:block absolute top-[50%] -translate-x-0 translate-y-[-50%] left-5 text-2xl  p-2 bg-black/20 text-white cursor-pointer">
				<BsChevronCompactLeft onClick={prevSlide} size={30} />
			</div>
			{/* Right Arrow */}
			<div className="hidden group-hover:block absolute top-[50%] -translate-x-0 translate-y-[-50%] right-5 text-2xl  p-2 bg-black/20 text-white cursor-pointer">
				<BsChevronCompactRight onClick={nextSlide} size={30} />
			</div>
			{/* <div className="flex justify-center py-2 absolute left-0 right-0 top-3/4 mt-16">
				{currentSlides.map((slide: any, slideIndex: any) => (
					<div
						key={slideIndex}
						onClick={() => goToSlide(slideIndex)}
						className={`text-2xl cursor-pointer ${
							currentIndex === slideIndex ? 'text-white' : 'text-gray-500'
						}`}
					>
						<MdCircle />
					</div>
				))}
			</div> */}
		</div>
	);
};
