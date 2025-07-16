import {
  MdCategory,
  MdChat,
  MdCropOriginal,
  MdDashboard,
  MdDns,
  MdFormatListBulleted,
  MdOutlineChat,
  MdOutlineContentPasteSearch,
  MdOutlineDeveloperBoard,
  MdOutlineFeed,
  MdOutlineGridView,
  MdOutlineHome,
  MdSupervisedUserCircle,
  MdLocalOffer,
  MdCardGiftcard,
  MdOutlineSettings,
  MdAssignmentReturn,
  MdBugReport
} from 'react-icons/md';
import { BiCategory, BiNews, BiSolidCategory } from 'react-icons/bi';
import { CiViewList } from 'react-icons/ci';

export const MenuItems = [
  {
    title: 'General',
    items: [
      {
        title: 'Trang Chủ',
        icon: MdOutlineHome,
        path: '/admin'
      },
      {
        title: 'Cửa Hàng',
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
        title: 'Thực Đơn',
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
        title: 'Chương Trình',
        icon: MdLocalOffer,
        badge: 3,
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
        title: 'Kênh Bán Hàng',
        icon: MdOutlineFeed,
        badge: 3,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Danh sách',
            path: '/admin/manage-orders'
          },
          {
            title: 'Kanban',
            path: '/admin/manage-orders/kanban'
          },
          {
            title: 'Đổi/Trả hàng',
            path: '/admin/manage-returns'
          }
        ]
      },
      {
        title: 'Thiết Bị',
        icon: MdOutlineDeveloperBoard,
        badge: 3,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Slide',
            path: '/admin/manage-banner'
          },
          {
            title: 'Tin nhắn',
            path: '/admin/chat'
          }
        ]
      },
      {
        title: 'Nhân Viên',
        icon: MdSupervisedUserCircle,
        path: '/admin/manage-staff'
      },
      {
        title: 'Ứng Dụng',
        icon: MdOutlineGridView,
        badge: 3,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Khách hàng',
            path: '/admin/manage-users'
          }
        ]
      },
      {
        title: 'Báo Cáo',
        icon: MdAssignmentReturn,
        hasSubmenu: true,
        submenu: [
          {
            title: 'Thống kê',
            path: '/admin/analytics'
          }
        ]
      }
    ]
  },
  {
    title: 'Pages',
    items: [
      {
        title: 'Secured by Clerk',
        icon: MdOutlineSettings,
        hasSubmenu: true
      },
      {
        title: 'Auth',
        icon: MdSupervisedUserCircle,
        hasSubmenu: true
      },
      {
        title: 'Errors',
        icon: MdBugReport,
        hasSubmenu: true
      }
    ]
  }
];
