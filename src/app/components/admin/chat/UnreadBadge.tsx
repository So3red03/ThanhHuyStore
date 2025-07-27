'use client';

import { useEffect, useState } from 'react';

interface UnreadBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'danger' | 'warning';
  className?: string;
  animate?: boolean;
}

const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  size = 'md',
  variant = 'danger',
  className = '',
  animate = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  // Animation effect when count changes
  useEffect(() => {
    if (count > 0) {
      setIsVisible(true);
      
      // Pulse animation when count increases
      if (animate && count > prevCount) {
        const badge = document.querySelector(`[data-badge-id="${count}"]`);
        if (badge) {
          badge.classList.add('animate-pulse');
          setTimeout(() => {
            badge.classList.remove('animate-pulse');
          }, 600);
        }
      }
    } else {
      // Fade out animation
      if (animate) {
        setTimeout(() => setIsVisible(false), 150);
      } else {
        setIsVisible(false);
      }
    }
    
    setPrevCount(count);
  }, [count, prevCount, animate]);

  if (count <= 0 || !isVisible) return null;

  // Size configurations
  const sizeClasses = {
    sm: 'h-4 w-4 text-xs min-w-[16px]',
    md: 'h-5 w-5 text-xs min-w-[20px]',
    lg: 'h-6 w-6 text-sm min-w-[24px]'
  };

  // Variant configurations
  const variantClasses = {
    primary: 'bg-blue-500 text-white',
    danger: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white'
  };

  // Format count display (99+ for large numbers)
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <div
      data-badge-id={count}
      className={`
        inline-flex items-center justify-center
        rounded-full font-medium
        transform transition-all duration-200 ease-in-out
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${animate ? 'animate-in fade-in zoom-in-50' : ''}
        ${className}
      `}
      style={{
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        border: '2px solid white'
      }}
      role="status"
      aria-label={`${count} tin nhắn chưa đọc`}
    >
      {displayCount}
    </div>
  );
};

export default UnreadBadge;
