'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { BsChevronCompactLeft, BsChevronCompactRight } from 'react-icons/bs';
import { MdCircle } from 'react-icons/md';
import { Fade, Box, IconButton } from '@mui/material';

interface HomeBannerProps {
  bannerData: any;
}

export const HomeBanner: React.FC<HomeBannerProps> = ({ bannerData }) => {
  const searchParams = useSearchParams(); // Hook để lấy query params
  const searchTerm = searchParams?.get('searchTerm'); // Lấy giá trị của 'searchTerm'
  const category = searchParams?.get('category');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSlides, setCurrentSlides] = useState(bannerData.map((b: any) => b.image));
  const [isLoaded, setIsLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const prevSlide = useCallback(() => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? bannerData.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, bannerData.length]);

  const nextSlide = useCallback(() => {
    const isLastSlide = currentIndex === bannerData.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, bannerData.length]);

  const goToSlide = useCallback((slideIndex: number) => {
    setCurrentIndex(slideIndex);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCurrentSlides(bannerData.map((b: any) => b.imageResponsive));
      } else {
        setCurrentSlides(bannerData.map((b: any) => b.image));
      }
    };

    handleResize();
    setIsLoaded(true); // Set loaded after initial setup

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [bannerData]);

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set new interval
    intervalRef.current = setInterval(nextSlide, 2500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nextSlide]);

  if (searchTerm || category) {
    return null;
  }
  return (
    <Fade in={isLoaded} timeout={800}>
      <Box className='w-full h-[70vh] mx-auto relative group mb-8 overflow-hidden'>
        <Fade in={true} timeout={500} key={currentIndex}>
          <div
            style={{ backgroundImage: `url(${currentSlides[currentIndex]})` }}
            className='w-full h-full bg-center bg-cover transition-all duration-700 ease-in-out'
          />
        </Fade>

        {/* Left Arrow */}
        {/* <Fade in={true} timeout={300}>
          <IconButton
            onClick={prevSlide}
            className='hidden group-hover:block absolute top-[50%] -translate-y-1/2 left-5 bg-black/30 hover:bg-black/50 text-white transition-all duration-300'
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.6)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <BsChevronCompactLeft size={30} />
          </IconButton>
        </Fade> */}

        {/* Right Arrow */}
        {/* <Fade in={true} timeout={300}>
          <IconButton
            onClick={nextSlide}
            className='hidden group-hover:block absolute top-[50%] -translate-y-1/2 right-5 bg-black/30 hover:bg-black/50 text-white transition-all duration-300'
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.6)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <BsChevronCompactRight size={30} />
          </IconButton>
        </Fade> */}

        {/* Dots Indicator */}
        <div className='flex justify-center py-2 absolute left-0 right-0 bottom-4'>
          {currentSlides.map((_slide: any, slideIndex: number) => (
            <IconButton
              key={slideIndex}
              onClick={() => goToSlide(slideIndex)}
              className={`text-lg transition-all duration-300 ${
                currentIndex === slideIndex ? 'text-white scale-125' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <MdCircle />
            </IconButton>
          ))}
        </div>
      </Box>
    </Fade>
  );
};
