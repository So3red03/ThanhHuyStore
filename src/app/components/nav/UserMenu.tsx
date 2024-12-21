'use client';

import { useState } from 'react';
import { AiFillCaretDown } from 'react-icons/ai';
import { SafeUser } from '../../../../types';
import Avatar from '../Avatar';
import BackDrop from './BackDrop';
import Link from 'next/link';
import MenuItem from './MenuItem';
import { signOut } from 'next-auth/react';
import { CiLogout, CiRead, CiUser, CiViewList } from 'react-icons/ci';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '../ConfirmDialog';

interface UserMenuProps {
	currentUser: SafeUser | null | undefined;
}

const UserMenu: React.FC<UserMenuProps> = ({ currentUser }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isConfirm, setIsConfirm] = useState(false);
	const router = useRouter();
	const handleMouseEnter = () => {
		setIsOpen(true);
	};

	const handleMouseLeave = () => {
		setIsOpen(false);
	};
	const toggleConfirmSignOut = () => {
		setIsConfirm(!isConfirm);
	};

	const handleConfirm = () => {
		toggleConfirmSignOut();
		signOut();
	};
	return (
		<>
			<div className="relative z-30">
				<div
					onMouseEnter={handleMouseEnter}
					className="p-2 border-[1px] border-slate-400 flex flex-row items-center gap-1 rounded-full cursor-pointer hover:shadow-md text-slate-700"
				>
					<Avatar src={currentUser?.image} />
					<AiFillCaretDown />
				</div>
				<div
					onMouseLeave={handleMouseLeave}
					className={`${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${
						currentUser ? 'w-[210px]' : 'w-fit'
					} absolute transition-opacity duration-300 rounded-md shadow-md bg-white overflow-hidden right-5 top-12 flex flex-col cursor-pointer`}
				>
					{currentUser ? (
						<div>
							<h2
								className="px-3 py-3 hover:underline text-center"
								onClick={() => {
									handleMouseLeave();
								}}
							>
								<Link href={'/account'}>Xin chào, {currentUser.name}</Link>
							</h2>
							<hr />
							{/* Chỉ có admin mới hiện dashboard */}
							{currentUser.role === 'ADMIN' && (
								<Link href="/admin">
									<MenuItem onClick={handleMouseLeave}>
										<span className="text-xl">
											<CiUser />
										</span>
										Dashboard
									</MenuItem>
								</Link>
							)}
							<Link href="/account/orders">
								<MenuItem onClick={handleMouseLeave}>
									<span className="text-xl">
										<CiViewList />
									</span>
									Đơn hàng của tôi
								</MenuItem>
							</Link>
							<Link href="/account/viewed">
								<MenuItem onClick={handleMouseLeave}>
									<span className="text-xl">
										<CiRead />
									</span>
									Đã xem gần đây
								</MenuItem>
							</Link>
							<MenuItem
								onClick={() => {
									handleMouseLeave();
									setIsConfirm(true);
								}}
							>
								<span className="text-xl rotate-180">
									<CiLogout />
								</span>
								Đăng xuất
							</MenuItem>
						</div>
					) : (
						<div className="w-full p-4">
							<h3 className="whitespace-nowrap mb-2 text-[15px]">Xin chào, vui lòng đăng nhập</h3>
							<div className="flex items-center just gap-x-2 w-full">
								<Link href="/login">
									<button
										onClick={handleMouseLeave}
										className="px-6 py-2 mb-2 whitespace-nowrap bg-slate-600 border-slate-600 text-white font-semibold text-sm transform-none rounded flex-1 hover:opacity-80"
									>
										Đăng nhập
									</button>
								</Link>
								<Link href="/register">
									<button
										onClick={handleMouseLeave}
										className="bg-[#ececec] whitespace-nowrap border-[#ececec] px-6 py-2 mb-2 font-semibold text-sm transform-none rounded flex-1 hover:opacity-80"
									>
										Đăng ký
									</button>
								</Link>
							</div>
						</div>
					)}
				</div>
			</div>
			{isConfirm && (
				<ConfirmDialog
					isOpen={isConfirm}
					handleClose={toggleConfirmSignOut}
					alert={false}
					onConfirm={handleConfirm}
				>
					Bạn muốn thoát tài khoản?
				</ConfirmDialog>
			)}
			{isOpen ? <BackDrop onClick={handleMouseLeave} /> : null}
		</>
	);
};

export default UserMenu;
