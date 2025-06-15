'use client';
import Heading from '../Heading';
import Button from '../Button';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { MdAdd, MdNotifications, MdNotificationsNone, MdOutlineChat, MdPublic, MdSearch } from 'react-icons/md';
import AddProductModal from '@/app/(admin)/admin/manage-products/AddProductModal';
import AddBannerModal from '@/app/(admin)/admin/manage-banner/AddBannerModal';
import { useSidebar } from '@/app/providers/SidebarProvider';
import axios from 'axios';
import AddArticleModal from '@/app/(admin)/admin/manage-articles/AddArticleModal';
import Image from 'next/image';
import { SafeUser } from '../../../../types';
import { redressed } from './AdminSideBar';
import Link from 'next/link';
import MenuItem from '../nav/MenuItem';
import { CiChat1, CiLogout, CiSettings, CiUser } from 'react-icons/ci';
import { signOut } from 'next-auth/react';
import AddArticleCateModal from '@/app/(admin)/admin/manage-articlesCategory/AddArticleCateModal';
import { ArticleCategory, Category } from '@prisma/client';
import AddProductCateModal from '@/app/(admin)/admin/manage-categories/AddProductCateModal';
import AddProductChildCate from '@/app/(admin)/admin/manage-childCategories/AddProductChildCateModal';
import AddProductChildCateModal from '@/app/(admin)/admin/manage-childCategories/AddProductChildCateModal';
import { getSubCategories } from '@/app/actions/getProductCategories';

const pathTitle: { [key: string]: string } = {
  '/admin': 'Tổng quan',
  '/admin/add-users': 'Thêm người dùng',
  '/admin/manage-products': 'Quản lý sản phẩm',
  '/admin/manage-orders': 'Quản lý đơn hàng',
  '/admin/manage-orders/kanban': 'Kanban Đơn hàng',
  '/admin/manage-users': 'Quản lý người dùng',
  '/admin/manage-categories': 'Quản lý danh mục cha',
  '/admin/manage-childCategories': 'Quản lý danh mục con',
  '/admin/manage-banner': 'Quản lý slider',
  '/admin/manage-articles': 'Quản lý bài viết',
  '/admin/manage-articlesCategory': 'Quản lý danh mục',
  '/admin/manage-vouchers': 'Quản lý Voucher',
  '/admin/manage-promotions': 'Quản lý Promotion'
};

interface AdminNavProps {
  // notifications: any[];
  currentUser: SafeUser | null | undefined;
  articleCategory: ArticleCategory[];
  parentCategory: any;
  subCategories: any;
}

const AdminNav: React.FC<AdminNavProps> = ({ currentUser, articleCategory, parentCategory, subCategories }) => {
  const pathName = usePathname();
  const title = pathName?.startsWith('/admin/chat') ? 'Tin nhắn' : pathTitle[pathName as string];
  const [isOpen, setIsOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  const [isOpenBannerModal, setIsOpenBannerModal] = useState(false);
  const [isOpenArticleModal, setIsOpenArticleModal] = useState(false);
  const [isOpenArticleCateModal, setIsOpenArticleCateModal] = useState(false);
  const [isOpenProductCateModal, setIsOpenProductCateModal] = useState(false);
  const [isOpenProductChildCateModal, setIsOpenProductChildCateModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

  // Sử dụng notification hook
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(currentUser || null);
  // Thêm sản phẩm
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const toggleProfieOpen = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleOpenModal = () => {
    toggleOpen();
  };

  // Thêm Slide
  const toggleOpenBannerModal = () => {
    setIsOpenBannerModal(!isOpenBannerModal);
  };

  const handleOpenBannerModal = () => {
    toggleOpenBannerModal();
  };

  // Mở thông báo và cập nhật isRead cho thông báo vào csdl
  // const toggleNotifications = async () => {
  // 	setIsMessagesOpen(false);
  // 	setIsNotificationsOpen(!isNotificationsOpen);
  // 	if (isNotificationsOpen) {
  // 		// Lọc thông báo chưa đọc
  // 		const unreadNotifications = notifications.filter((notification) => notification.isRead === false);

  // 		if (unreadNotifications.length > 0) {
  // 			// Tạo một mảng Promise để thực hiện nhiều yêu cầu đồng thời
  // 			const updateNotifications = unreadNotifications.map((notification) => {
  // 				return axios.put(`/api/notifications/${notification.id}`, { isRead: true });
  // 			});

  // 			await Promise.all(updateNotifications);
  // 			setUnreadCount(0);
  // 		}
  // 	}
  // };
  // Mở thông báo tin nhắn
  const toggleMesssages = () => {
    setIsNotificationsOpen(false);
    setIsMessagesOpen(!isMessagesOpen);
  };

  // Mở thông báo và đánh dấu đã đọc
  const toggleNotifications = async () => {
    setIsMessagesOpen(false);
    setIsNotificationsOpen(!isNotificationsOpen);

    if (!isNotificationsOpen) {
      // Đánh dấu tất cả notifications đã đọc khi mở
      await markAllAsRead();
    }
  };

  // Handle click notification item
  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  // Thêm bài viết
  const toggleOpenArticleModal = () => {
    setIsOpenArticleModal(!isOpenArticleModal);
  };

  const handleOpenArticleModal = () => {
    toggleOpenArticleModal();
  };

  // Thêm danh mục bài viết
  const toggleOpenArticleCateModal = () => {
    setIsOpenArticleCateModal(!isOpenArticleCateModal);
  };

  const handleOpenArticleCateModal = () => {
    toggleOpenArticleCateModal();
  };
  // Thêm danh mục cha sản phẩm
  const toggleOpenProductCateModal = () => {
    setIsOpenProductCateModal(!isOpenProductCateModal);
  };

  const handleOpenProductCateModal = () => {
    toggleOpenProductCateModal();
  };
  // Thêm danh mục con sản phẩm
  const toggleOpenProductChildCateModal = () => {
    setIsOpenProductChildCateModal(!isOpenProductChildCateModal);
  };

  const handleOpenProductChildCateModal = () => {
    toggleOpenProductChildCateModal();
  };
  return (
    <>
      <div className='bg-slate-200 sticky top-0 z-40 w-full p-[7px] lg:px-5 rounded-lg flex items-center justify-between shadow-md'>
        <div className='inline-flex w-2/3 gap-2 lg:gap-8 lg:mr-0 items-center'>
          <div className='text-xl lg:text-2xl font-bold whitespace-nowrap'>{title}</div>
          <button onClick={toggleSidebar}>
            {/* Icon burger menu */}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-6 h-6 lg:h-8 lg:w-8'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16m-7 6h7' />
            </svg>
          </button>
          {/* Button thêm modal */}
          {title === 'Quản lý sản phẩm' ? (
            <Button
              label='Thêm sản phẩm'
              small
              custom='!bg-slate-200 !text-slate-700 !gap-1 !w-auto !text-xs lg:!text-base'
              icon={MdAdd}
              onClick={() => {
                handleOpenModal();
              }}
            />
          ) : title === 'Quản lý slider' ? (
            <Button
              label='Thêm slider'
              small
              custom='!bg-slate-200 !text-slate-700 !gap-1 !w-auto !text-xs lg:!text-base'
              icon={MdAdd}
              onClick={() => {
                handleOpenBannerModal();
              }}
            />
          ) : title === 'Quản lý bài viết' ? (
            <Button
              label='Thêm bài viết'
              small
              custom='!bg-slate-200 !text-slate-700 !gap-1 !w-auto !text-xs lg:!text-base'
              icon={MdAdd}
              onClick={() => {
                handleOpenArticleModal();
              }}
            />
          ) : pathName === '/admin/manage-articlesCategory' ? (
            <Button
              label='Thêm danh mục'
              small
              custom='!bg-slate-200 !text-slate-700 !gap-1 !w-auto !text-xs lg:!text-base'
              icon={MdAdd}
              onClick={() => {
                handleOpenArticleCateModal();
              }}
            />
          ) : pathName === '/admin/manage-categories' ? (
            <Button
              label='Thêm danh mục'
              small
              custom='!bg-slate-200 !text-slate-700 !gap-1 !w-auto !text-xs lg:!text-base'
              icon={MdAdd}
              onClick={() => {
                handleOpenProductCateModal();
              }}
            />
          ) : pathName === '/admin/manage-childCategories' ? (
            <Button
              label='Thêm danh mục'
              small
              custom='!bg-slate-200 !text-slate-700 !gap-1 !w-auto !text-xs lg:!text-base'
              icon={MdAdd}
              onClick={() => {
                handleOpenProductChildCateModal();
              }}
            />
          ) : null}
        </div>
        <div className='flex items-center gap-2 lg:gap-5'>
          <div className='relative flex items-center gap-2 lg:gap-x-2'>
            {/* <MdPublic className="text-xl lg:text-2xl" /> */}
            <div
              className='relative cursor-pointer hover:bg-gray-300 focus:bg-gray-300 rounded-full p-[6px]'
              onClick={toggleMesssages}
            >
              <MdOutlineChat className='text-xl lg:text-2xl cursor-pointer' />

              {unreadCount > 0 && ( // Chỉ hiển thị span nếu có thông báo chưa đọc
                <span
                  className={`absolute select-none top-[-5px] right-[-4px] bg-[#D43232] text-white h-4 w-4 rounded-full flex items-center justify-center text-xs`}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {/* Hiển thị tin nhắn */}
            <div
							className={`absolute top-10 right-[-20px] bg-white z-10 shadow-lg rounded-lg w-72 lg:w-80  transition-opacity duration-300 max-h-[470px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent ${
								isMessagesOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
							}`}
						>
							<div className="flex justify-between items-center p-3 border-b border-gray-300">
								<div className="font-semibold text-lg">Tin nhắn</div>
								<span className="bg-slate-600 rounded-full px-2 py-1 text-white font-semibold text-xs select-none">
									{notifications.length}
								</span>
							</div>
							{notifications.map((notification: any) => (
								<div
									key={notification.id}
									className="hover:bg-[#f6f9ff] border-b border-gray-300 flex items-start justify-between p-4 cursor-pointer transition-all duration-300"
								>
									<div>
										{notification.type === 'ORDER_PLACED' && (
											<>
												<div className="text-sm font-medium">Thông báo đặt hàng</div>
												<div className="flex items-center p-4 border-b border-[#CFCFCF]">
													<Image
														className="rounded-full object-cover"
														src="/no-avatar-2.jpg"
														alt=""
														width="50"
														height="50"
													/>
													<div className="text-xs text-gray-500">
														{notification.user.name} vừa đặt hàng
													</div>
												</div>
											</>
										)}
										{notification.type === 'COMMENT_RECEIVED' && (
											<>
												<div className="text-sm font-medium">Thông báo comment</div>
												<div className="flex items-center gap-x-3 mt-1">
													<Image
														className="rounded-full object-cover"
														src="/no-avatar-2.jpg"
														alt={notification.user.name}
														width="30"
														height="30"
													/>
													<div className="text-xs text-gray-500">
														{notification.user.name} vừa bình luận
													</div>
												</div>
											</>
										)}
										{notification.type === 'LOW_STOCK' && (
											<>
												<div className="text-sm font-medium">Thông báo hết hàng</div>
												<div className="flex items-center gap-x-3 mt-1">
													<Image
														className="rounded-full object-cover"
														src="/no-avatar-2.jpg"
														alt={notification?.user?.name}
														width="30"
														height="30"
													/>
													<div className="text-xs text-gray-500">
														{notification?.products} hết hàng
													</div>
												</div>
											</>
										)}
									</div>
								</div>
							))}
							<div className="flex justify-center py-2">
								<Button
									label="Tất cả thông báo"
									custom="!w-[250px] !text-sm !py-1 !px-2"
									onClick={() => {}}
								/>
							</div>
						</div>
            <div
              className='relative cursor-pointer hover:bg-gray-300 focus:bg-gray-300 rounded-full p-[6px]'
              onClick={toggleNotifications}
            >
              <MdNotificationsNone className='text-xl lg:text-2xl cursor-pointer' />
              {unreadCount > 0 && ( // Chỉ hiển thị span nếu có thông báo chưa đọc
                <span
                  className={`absolute select-none top-[-5px] right-[-4px] bg-[#D43232] text-white h-4 w-4 rounded-full flex items-center justify-center text-xs`}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Hiển thị thông báo */}
            <div
							className={`absolute top-10 right-[-20px] bg-white z-10 shadow-lg rounded-lg w-72 lg:w-80  transition-opacity duration-300 max-h-[470px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent ${
								isNotificationsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
							}`}
						>
							<div className="flex justify-between items-center p-3 border-b border-gray-300">
								<div className="font-semibold text-lg">Thông báo</div>
								<span className="bg-slate-600 rounded-full px-2 py-1 text-white font-semibold text-xs select-none">
									{notifications.length}
								</span>
							</div>
							{notifications.length === 0 ? (
								<div className="p-4 text-center text-gray-500">
									Không có thông báo nào
								</div>
							) : (
								notifications.map((notification: any) => (
									<div
										key={notification.id}
										className={`hover:bg-[#f6f9ff] border-b border-gray-300 flex items-start justify-between p-4 cursor-pointer transition-all duration-300 ${
											!notification.isRead ? 'bg-blue-50' : ''
										}`}
										onClick={() => handleNotificationClick(notification.id)}
									>
										<div className="flex-1">
											<div className="text-sm font-medium">{notification.title}</div>
											<div className="text-xs text-gray-500 mt-1">{notification.message}</div>
											<div className="text-xs text-gray-400 mt-1">
												{new Date(notification.createdAt).toLocaleString('vi-VN')}
											</div>
										</div>
										{!notification.isRead && (
											<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
										)}
									</div>
								))
							)}
							<div className="flex justify-center py-2">
								<Button
									label="Tất cả thông báo"
									custom="!w-[250px] !text-sm !py-1 !px-2"
									onClick={() => {}}
								/>
							</div>
						</div>
          </div>
          <div className='flex items-center bg-white rounded-lg lg:gap-x-2 gap-x-1'>
            <MdSearch size={18} className='ml-1' />
            <input
              type='text'
              placeholder='Tìm kiếm...'
              className='bg-transparent border-none focus:outline-none lg:p-1 py-1 px-0 lg:w-60 w-36'
            />
          </div>
          <div className='relative'>
            <div className='flex items-center gap-2 lg:gap-4 cursor-pointer' onClick={() => toggleProfieOpen()}>
              <span className='hidden text-right lg:block whitespace-nowrap'>
                <span className={`${redressed.className} block text-base font-semibold`}>{currentUser?.name}</span>
                <span className='block text-xs text-gray-500'>Administrator</span>
              </span>
              <span className='h-9 w-9 rounded-full'>
                <Image
                  className='rounded-full object-cover'
                  src={currentUser?.image ?? '/no-avatar-2.jpg'}
                  alt=''
                  width='50'
                  height='50'
                />
              </span>
              <svg
                className='fill-current block'
                width={12}
                height={8}
                viewBox='0 0 12 8'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z'
                />
              </svg>
            </div>
            <div
              className={`absolute rounded-lg right-[-20px] mt-2 lg:flex w-[250px] duration-300  flex-col cursor-pointer bg-white z-30 shadow-md ${
                isProfileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <ul className='flex flex-col border-b border-stroke py-4 pb-2'>
                <li>
                  <Link href='/admin'>
                    <MenuItem onClick={() => {}}>
                      <span className='text-xl'>
                        <CiUser />
                      </span>
                      Trang cá nhân
                    </MenuItem>
                  </Link>
                </li>
                <li>
                  <Link href='/admin/chat'>
                    <MenuItem onClick={() => {}}>
                      <span className='text-xl'>
                        <CiChat1 />
                      </span>
                      Liên hệ
                    </MenuItem>
                  </Link>
                </li>
                <li>
                  <Link href='/admin'>
                    <MenuItem onClick={() => {}}>
                      <span className='text-xl'>
                        <CiSettings />
                      </span>
                      Cài đặt
                    </MenuItem>
                  </Link>
                </li>
              </ul>
              <MenuItem
                onClick={() => {
                  signOut();
                }}
              >
                <span className='text-xl rotate-180'>
                  <CiLogout />
                </span>
                Đăng xuất
              </MenuItem>
            </div>
          </div>
        </div>
      </div>
      <AddProductModal
        isOpen={isOpen}
        toggleOpen={toggleOpen}
        parentCategories={parentCategory}
        subCategories={subCategories}
      />
      <AddBannerModal isOpen={isOpenBannerModal} toggleOpen={toggleOpenBannerModal} />
      <AddArticleModal
        isOpen={isOpenArticleModal}
        toggleOpen={toggleOpenArticleModal}
        articleCategory={articleCategory}
      />
      <AddProductChildCateModal
        isOpen={isOpenProductChildCateModal}
        toggleOpen={toggleOpenProductChildCateModal}
        parentCategory={parentCategory}
      />
      <AddArticleCateModal isOpen={isOpenArticleCateModal} toggleOpen={toggleOpenArticleCateModal} />
      <AddProductCateModal isOpen={isOpenProductCateModal} toggleOpen={toggleOpenProductCateModal} />
    </>
  );
};

export default AdminNav;
