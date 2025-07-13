import { DeliveryStatus, OrderStatus } from '@prisma/client';

/**
 * Kiểm tra xem có thể chuyển trạng thái đơn hàng không
 */
export const canTransitionOrderStatus = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  deliveryStatus?: DeliveryStatus | null
): boolean => {
  // Không thể chuyển sang chính nó
  if (currentStatus === newStatus) return false;

  switch (currentStatus) {
    case OrderStatus.pending:
      // Từ pending có thể chuyển sang confirmed hoặc canceled
      return newStatus === OrderStatus.confirmed || newStatus === OrderStatus.canceled;

    case OrderStatus.confirmed:
      // Từ confirmed có thể chuyển sang completed hoặc canceled (chỉ khi chưa ship)
      if (newStatus === OrderStatus.completed) return true;
      if (newStatus === OrderStatus.canceled) {
        // Chỉ cho phép hủy khi chưa giao hàng
        return !deliveryStatus || deliveryStatus === DeliveryStatus.not_shipped;
      }
      return false;

    case OrderStatus.completed:
      // Đơn hàng đã hoàn thành không thể chuyển sang trạng thái khác
      return false;

    case OrderStatus.canceled:
      // Đơn hàng đã hủy không thể chuyển sang trạng thái khác
      return false;

    default:
      return false;
  }
};

/**
 * Lấy danh sách các trạng thái có thể chuyển đến
 */
export const getValidOrderStatusTransitions = (
  currentStatus: OrderStatus,
  deliveryStatus?: DeliveryStatus | null
): OrderStatus[] => {
  const allStatuses = [OrderStatus.pending, OrderStatus.confirmed, OrderStatus.completed, OrderStatus.canceled];
  return allStatuses.filter(status => canTransitionOrderStatus(currentStatus, status, deliveryStatus));
};

/**
 * Kiểm tra xem có thể chuyển trạng thái giao hàng không
 */
export const canTransitionDeliveryStatus = (
  currentDelivery: DeliveryStatus | null,
  newDelivery: DeliveryStatus,
  orderStatus: OrderStatus
): boolean => {
  // Chỉ có thể thay đổi delivery status khi order đã confirmed
  if (orderStatus === OrderStatus.pending || orderStatus === OrderStatus.canceled) {
    return false;
  }

  if (!currentDelivery) currentDelivery = DeliveryStatus.not_shipped;
  if (currentDelivery === newDelivery) return false;

  switch (currentDelivery) {
    case DeliveryStatus.not_shipped:
      // Từ not_shipped chỉ có thể chuyển sang in_transit
      return newDelivery === DeliveryStatus.in_transit;

    case DeliveryStatus.in_transit:
      // Từ in_transit có thể chuyển sang delivered
      return newDelivery === DeliveryStatus.delivered;

    case DeliveryStatus.delivered:
      // Từ delivered không thể chuyển (hoàn trả sẽ là tính năng mở rộng)
      return false;

    case DeliveryStatus.returning:
    case DeliveryStatus.returned:
      // Các trạng thái hoàn trả (tính năng mở rộng tương lai)
      return false;

    default:
      return false;
  }
};

/**
 * Lấy danh sách các trạng thái giao hàng có thể chuyển đến
 */
export const getValidDeliveryStatusTransitions = (
  currentDelivery: DeliveryStatus | null,
  orderStatus: OrderStatus
): DeliveryStatus[] => {
  const allStatuses = [
    DeliveryStatus.not_shipped,
    DeliveryStatus.in_transit,
    DeliveryStatus.delivered,
    DeliveryStatus.returning,
    DeliveryStatus.returned
  ];
  return allStatuses.filter(status => canTransitionDeliveryStatus(currentDelivery, status, orderStatus));
};

/**
 * Validate order status transition with detailed error message
 */
export const validateOrderStatusTransition = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  deliveryStatus?: DeliveryStatus | null
): { isValid: boolean; error?: string } => {
  if (currentStatus === newStatus) {
    return { isValid: false, error: 'Trạng thái mới phải khác trạng thái hiện tại' };
  }

  if (!canTransitionOrderStatus(currentStatus, newStatus, deliveryStatus)) {
    const statusNames = {
      [OrderStatus.pending]: 'Chờ thanh toán',
      [OrderStatus.confirmed]: 'Đã thanh toán',
      [OrderStatus.completed]: 'Hoàn thành',
      [OrderStatus.canceled]: 'Đã hủy'
    };

    return {
      isValid: false,
      error: `Không thể chuyển từ "${statusNames[currentStatus]}" sang "${statusNames[newStatus]}"`
    };
  }

  return { isValid: true };
};

/**
 * Validate delivery status transition with detailed error message
 */
export const validateDeliveryStatusTransition = (
  currentDelivery: DeliveryStatus | null,
  newDelivery: DeliveryStatus,
  orderStatus: OrderStatus
): { isValid: boolean; error?: string } => {
  if (!canTransitionDeliveryStatus(currentDelivery, newDelivery, orderStatus)) {
    const deliveryNames = {
      [DeliveryStatus.not_shipped]: 'Chưa giao hàng',
      [DeliveryStatus.in_transit]: 'Đang vận chuyển',
      [DeliveryStatus.delivered]: 'Đã giao',
      [DeliveryStatus.returning]: 'Đang hoàn trả',
      [DeliveryStatus.returned]: 'Đã hoàn trả'
    };

    const currentName = currentDelivery ? deliveryNames[currentDelivery] : 'Chưa xác định';
    const newName = deliveryNames[newDelivery];

    return {
      isValid: false,
      error: `Không thể chuyển từ "${currentName}" sang "${newName}"`
    };
  }

  return { isValid: true };
};
