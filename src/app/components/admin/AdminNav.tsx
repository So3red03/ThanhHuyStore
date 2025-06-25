'use client';
import Button from '../Button';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { MdAdd, MdNotifications, MdNotificationsNone, MdOutlineChat, MdSearch } from 'react-icons/md';
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
import { ArticleCategory } from '@prisma/client';
import AddProductCateModal from '@/app/(admin)/admin/manage-categories/AddProductCateModal';
import AddProductChildCateModal from '@/app/(admin)/admin/manage-childCategories/AddProductChildCateModal';

const pathTitle: { [key: string]: string } = {
  '/admin': 'Tổng quan',
  '/admin/add-users': 'Thêm người dùng',
  '/admin/manage-products': 'Quản lý sản phẩm',
  '/admin/manage-orders': 'Quản lý đơn hàng',
  '/admin/manage-orders/kanban': 'Kanban Đơn hàng',
  '/admin/manage-returns': 'Quản lý đổi/trả hàng',
  '/admin/manage-users': 'Quản lý người dùng',
  '/admin/manage-categories': 'Quản lý danh mục cha',
  '/admin/manage-childCategories': 'Quản lý danh mục con',
  '/admin/manage-banner': 'Quản lý slider',
  '/admin/manage-articles': 'Quản lý bài viết',
  '/admin/manage-articlesCategory': 'Quản lý danh mục',
  '/admin/manage-vouchers': 'Quản lý Voucher',
  '/admin/manage-promotions': 'Quản lý Promotion',
  '/admin/news-dashboard': 'Phân tích',
  '/admin/settings': 'Cài đặt hệ thống',
  '/admin/test-features': '🧪 Test Features'
};

interface AdminNavProps {
  currentUser: SafeUser | null | undefined;
  articleCategory: ArticleCategory[];
  parentCategory: any;
  subCategories: any;
}

const AdminNav: React.FC<AdminNavProps> = ({ currentUser, articleCategory, parentCategory, subCategories }) => {
  const pathName = usePathname();
  const router = useRouter();
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
  const [messages, setMessages] = useState<any[]>([]);

  // Sử dụng notification hook
  const {
    notifications: rawNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications(currentUser || null);

  // Đảm bảo notifications luôn là array
  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];
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
  // Fetch messages khi component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get('/api/notifications/messages');
        // API trả về object với notifications array
        const messagesData = response.data?.notifications || [];
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Set empty array nếu có lỗi
        setMessages([]);
      }
    };

    if (currentUser?.role === 'ADMIN') {
      fetchMessages();
    }
  }, [currentUser]);

  // Mở thông báo tin nhắn
  const toggleMesssages = () => {
    setIsNotificationsOpen(false);
    setIsMessagesOpen(!isMessagesOpen);
  };

  // Handle click message item - điều hướng đến chat
  const handleMessageClick = async (message: any) => {
    if (message.sender?.id) {
      // Tạo hoặc tìm conversation với user
      try {
        const response = await axios.post('/api/conversation', {
          userId: message.sender.id
        });
        router.push(`/admin/chat/${response.data.id}`);
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    } else if (message.chatroomId) {
      // Nếu đã có chatroom ID thì điều hướng trực tiếp
      router.push(`/admin/chat/${message.chatroomId}`);
    }
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
          <button onClick={toggleSidebar} aria-label='Toggle sidebar menu'>
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
            {/* Enhanced Messages Dropdown */}
            <div
              className={`absolute top-12 right-[-20px] bg-white z-50 shadow-xl rounded-xl w-80 lg:w-96 transition-all duration-300 border border-gray-200 ${
                isMessagesOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              {/* Header */}
              <div className='flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl'>
                <div className='flex items-center gap-2'>
                  <MdOutlineChat className='text-blue-600 text-lg' />
                  <span className='font-semibold text-gray-800'>💬 Tin nhắn</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='bg-blue-600 rounded-full px-2.5 py-1 text-white font-semibold text-xs'>
                    {messages.length}
                  </span>
                </div>
              </div>

              {/* Messages List */}
              <div className='max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'>
                {messages.length === 0 ? (
                  <div className='p-6 text-center'>
                    <div className='text-gray-400 text-4xl mb-2'>💬</div>
                    <div className='text-gray-500 font-medium'>Không có tin nhắn nào</div>
                    <div className='text-gray-400 text-sm mt-1'>Tin nhắn mới sẽ xuất hiện ở đây</div>
                  </div>
                ) : (
                  messages?.map((message: any) => (
                    <div
                      key={message.id}
                      className='hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-100 p-4 cursor-pointer transition-all duration-200 group'
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className='flex items-start gap-3'>
                        <div className='relative'>
                          <Image
                            className='rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200'
                            src={message.sender?.image || '/no-avatar-2.jpg'}
                            alt={message.sender?.name || 'User'}
                            width='44'
                            height='44'
                          />
                          {message.seenIds && !message.seenIds.includes(currentUser?.id) && (
                            <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white'></div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between mb-1'>
                            <span className='text-sm font-semibold text-gray-800 truncate'>
                              {message.sender?.name || 'Người dùng'}
                            </span>
                            <span className='text-xs text-gray-400 ml-2 flex-shrink-0'>
                              {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className='text-sm text-gray-600 truncate mb-1'>{message.body || 'Tin nhắn'}</div>
                          <div className='text-xs text-gray-400'>
                            {new Date(message.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className='p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl'>
                <Button
                  label='📱 Xem tất cả tin nhắn'
                  custom='!w-full !text-sm !py-2.5 !bg-blue-600 !text-white hover:!bg-blue-700 !rounded-lg !font-medium'
                  onClick={() => {
                    setIsMessagesOpen(false);
                    router.push('/admin/chat');
                  }}
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

            {/* Enhanced Notifications Dropdown */}
            <div
              className={`absolute top-12 right-[-20px] bg-white z-50 shadow-xl rounded-xl w-80 lg:w-96 transition-all duration-300 border border-gray-200 ${
                isNotificationsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              {/* Header */}
              <div className='flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-xl'>
                <div className='flex items-center gap-2'>
                  <MdNotifications className='text-orange-600 text-lg' />
                  <span className='font-semibold text-gray-800'>🔔 Thông báo</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='bg-orange-600 rounded-full px-2.5 py-1 text-white font-semibold text-xs'>
                    {notifications.length}
                  </span>
                  {unreadCount > 0 && (
                    <span className='bg-red-500 rounded-full px-2 py-1 text-white font-semibold text-xs'>
                      {unreadCount} mới
                    </span>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className='max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'>
                {notifications.length === 0 ? (
                  <div className='p-6 text-center'>
                    <div className='text-gray-400 text-4xl mb-2'>🔔</div>
                    <div className='text-gray-500 font-medium'>Không có thông báo nào</div>
                    <div className='text-gray-400 text-sm mt-1'>Thông báo mới sẽ xuất hiện ở đây</div>
                  </div>
                ) : (
                  notifications?.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 border-b border-gray-100 p-4 cursor-pointer transition-all duration-200 group ${
                        !notification.isRead
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500'
                          : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className='flex items-start gap-3'>
                        <div className='relative'>
                          {/* Notification Type Icon */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              notification.type === 'ORDER_PLACED'
                                ? 'bg-green-500'
                                : notification.type === 'COMMENT_RECEIVED'
                                ? 'bg-blue-500'
                                : notification.type === 'LOW_STOCK'
                                ? 'bg-red-500'
                                : notification.type === 'SYSTEM_ALERT'
                                ? 'bg-orange-500'
                                : 'bg-gray-500'
                            }`}
                          >
                            {notification.type === 'ORDER_PLACED'
                              ? '🛒'
                              : notification.type === 'COMMENT_RECEIVED'
                              ? '💬'
                              : notification.type === 'LOW_STOCK'
                              ? '⚠️'
                              : notification.type === 'SYSTEM_ALERT'
                              ? '🔔'
                              : '📢'}
                          </div>
                          {!notification.isRead && (
                            <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white'></div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between mb-1'>
                            <span
                              className={`text-sm font-semibold truncate ${
                                !notification.isRead ? 'text-blue-800' : 'text-gray-800'
                              }`}
                            >
                              {notification.title}
                            </span>
                            <span className='text-xs text-gray-400 ml-2 flex-shrink-0'>
                              {new Date(notification.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className='text-sm text-gray-600 mb-1 line-clamp-2'>{notification.message}</div>
                          <div className='text-xs text-gray-400'>
                            {new Date(notification.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className='p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl'>
                <div className='flex gap-2'>
                  {unreadCount > 0 && (
                    <Button
                      label='✅ Đánh dấu đã đọc'
                      custom='!flex-1 !text-xs !py-2 !bg-green-600 !text-white hover:!bg-green-700 !rounded-lg !font-medium'
                      onClick={() => markAllAsRead()}
                    />
                  )}
                  <Button
                    label='📋 Xem tất cả'
                    custom='!flex-1 !text-xs !py-2 !bg-orange-600 !text-white hover:!bg-orange-700 !rounded-lg !font-medium'
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      // Navigate to notifications page if exists
                    }}
                  />
                </div>
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
