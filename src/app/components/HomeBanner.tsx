'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { MdCircle } from 'react-icons/md';
import { Box, IconButton } from '@mui/material';

interface HomeBannerProps {
  bannerData: any;
}

export const HomeBanner: React.FC<HomeBannerProps> = ({ bannerData }) => {
  const searchParams = useSearchParams();
  const searchTerm = searchParams?.get('searchTerm');
  const category = searchParams?.get('category');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSlides, setCurrentSlides] = useState(bannerData.map((b: any) => b.image));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? bannerData.length - 1 : prev - 1));
  }, [bannerData.length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev === bannerData.length - 1 ? 0 : prev + 1));
  }, [bannerData.length]);

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
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [bannerData]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(nextSlide, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [nextSlide]);

  if (searchTerm || category) return null;

  return (
    <Box className='relative w-full h-[70vh] overflow-hidden mb-8'>
      {/* Image Slides */}
      <div className='relative w-full h-full'>
        {currentSlides.map((image: string, index: number) => (
          <img
            key={index}
            src={image}
            alt={`banner-${index}`}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}
      </div>

      {/* Dots Indicator */}
      <div className='absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-2'>
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
  );
};
