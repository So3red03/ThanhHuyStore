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
    title: 'Chung',
    dashboardItem: {
      title: 'Tổng quan',
      icon: MdDashboard,
      path: '/admin'
    }
  },
  {
    title: 'Danh mục',
    subItem: {
      title: 'Quản lý',
      icon: MdOutlineContentPasteSearch,
      list: [
        {
          title: 'Sản phẩm',
          icon: MdFormatListBulleted,
          list: [
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
          title: 'Người dùng',
          icon: MdSupervisedUserCircle,
          list: [
            {
              title: 'Danh sách',
              path: '/admin/manage-users'
            }
          ]
        },
        {
          title: 'Bài viết',
          icon: BiNews,
          list: [
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
          title: 'Đơn hàng',
          icon: MdOutlineFeed,
          list: [
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
          title: 'Slide',
          path: '/admin/manage-banner',
          icon: MdCropOriginal
        },
        {
          title: 'Tin nhắn',
          path: '/admin/chat',
          icon: MdOutlineChat
        },
        {
          title: 'Khuyến mãi',
          icon: MdLocalOffer,
          list: [
            {
              title: 'Voucher',
              path: '/admin/manage-vouchers'
            },
            {
              title: 'Promotion',
              path: '/admin/manage-promotions'
            }
          ]
        }
      ]
    }
  },
  {
    title: 'Khác',
    subItem: {
      title: 'Khác',
      icon: MdOutlineSettings,
      list: [
        {
          title: '🧪 Test Features',
          path: '/admin/test-features',
          icon: MdBugReport
        }
      ]
    }
  }
];
