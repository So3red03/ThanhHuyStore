'use client';
import React, { useEffect, useState } from 'react';
import { HiMenu } from 'react-icons/hi';
import MobileMenu from './MobileMenu'; // Nhập component MobileMenu
import { SafeUser } from '../../../../types';
import CartCount from './CartCount';
import OrderTracking from './OrderTracking';
import UserMenu from './UserMenu';

interface MobileNavbarProps {
	currentUser: SafeUser | null | undefined;
}
const MobileNavbar: React.FC<MobileNavbarProps> = ({ currentUser }) => {
	const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 1024);
		};

		handleResize(); // Kiểm tra lần đầu
		window.addEventListener('resize', handleResize); // Theo dõi thay đổi kích thước

		// Dọn dẹp khi component unmount
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	const toggleMobileMenu = () => {
		setMobileMenuOpen((prev) => !prev);
	};

	const closeMobileMenu = () => {
		setMobileMenuOpen(false);
	};

	return (
		<div>
			{isMobile ? (
				<div className="flex items-center justify-center gap-2 md:gap-3 lg:gap-5">
					<CartCount />
					<HiMenu className="text-xl cursor-pointer" onClick={toggleMobileMenu} />
					{isMobileMenuOpen && <MobileMenu onClose={closeMobileMenu} />}
				</div>
			) : (
				<div className="flex items-end justify-center gap-2 md:gap-3 lg:gap-5">
					<CartCount />
					<OrderTracking currentUser={currentUser} />
					<UserMenu currentUser={currentUser} />
				</div>
			)}
		</div>
	);
};

export default MobileNavbar;
