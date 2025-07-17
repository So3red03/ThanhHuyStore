import {
  MdFormatListBulleted,
  MdOutlineChat,
  MdOutlineDeveloperBoard,
  MdOutlineFeed,
  MdOutlineHome,
  MdSupervisedUserCircle,
  MdLocalOffer,
  MdOutlineSettings,
  MdLogout
} from 'react-icons/md';
import { BiSolidCategory } from 'react-icons/bi';

export const MenuItems = [
  {
    title: 'Chung',
    items: [
      {
        title: 'Trang Chủ',
        icon: MdOutlineHome,
        path: '/admin'
      },
      {
        title: 'Sản Phẩm',
        icon: MdFormatListBulleted,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Danh sách',
            path: '/admin/manage-products'
          },
          {
            title: 'Danh mục cha',
            path: '/admin/manage-categories'
          },
          {
            title: 'Danh mục con',
            path: '/admin/manage-childCategories'
          }
        ]
      },
      {
        title: 'Bài Viết',
        icon: BiSolidCategory,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Danh sách',
            path: '/admin/manage-articles'
          },
          {
            title: 'Danh mục',
            path: '/admin/manage-articlesCategory'
          }
        ]
      },
      {
        title: 'Khuyến Mãi',
        icon: MdLocalOffer,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Voucher',
            path: '/admin/manage-vouchers'
          },
          {
            title: 'Chiến dịch',
            path: '/admin/manage-promotions'
          }
        ]
      },
      {
        title: 'Đơn Hàng',
        icon: MdOutlineFeed,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Danh sách',
            path: '/admin/manage-orders'
          },
          {
            title: 'Kanban',
            path: '/admin/manage-orders/kanban'
          }
        ]
      },
      {
        title: 'Giao Diện',
        icon: MdOutlineDeveloperBoard,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Slide',
            path: '/admin/manage-banner'
          }
        ]
      },
      {
        title: 'Tin Nhắn',
        icon: MdOutlineChat,
        path: '/admin/chat'
      },
      {
        title: 'Tài Khoản',
        icon: MdSupervisedUserCircle,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Nhân viên',
            path: '/admin/manage-staff'
          },
          {
            title: 'Khách hàng',
            path: '/admin/manage-users'
          }
        ]
      }
    ]
  },
  {
    title: 'Hệ Thống',
    items: [
      {
        title: 'Cài Đặt',
        icon: MdOutlineSettings,
        path: '/admin/settings'
      },
      {
        title: 'Đăng Xuất',
        icon: MdLogout,
        action: 'logout'
      }
    ]
  }
];
