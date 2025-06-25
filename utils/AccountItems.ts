import { CiRead, CiUser, CiViewList } from 'react-icons/ci';
import { MdAssignmentReturn } from 'react-icons/md';

export const AccountItems = [
  {
    title: 'Thông tin tài khoản',
    path: '/account',
    icon: CiUser
  },
  {
    title: 'Quản lý đơn hàng',
    path: '/account/orders',
    icon: CiViewList
  },
  {
    title: 'Đổi/Trả hàng',
    path: '/account/returns',
    icon: MdAssignmentReturn
  },
  {
    title: 'Sản phẩm đã xem',
    path: '/account/viewed',
    icon: CiRead
  }
];
