'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Order, OrderStatus, DeliveryStatus } from '@prisma/client';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

interface KanbanBoardProps {
  orders: any[];
  onOrderUpdate: () => void;
}

// Định nghĩa các cột Kanban (đã bỏ "Đã xác nhận" và "Đang giao hàng - Nội bộ")
const KANBAN_COLUMNS = [
  {
    id: 'pending',
    title: 'Chờ xác nhận',
    color: 'bg-purple-500',
    count: 0
  },
  {
    id: 'preparing',
    title: 'Đang chuẩn bị',
    color: 'bg-blue-500',
    count: 0
  },
  {
    id: 'shipping',
    title: 'Đang giao hàng',
    color: 'bg-pink-500',
    count: 0
  },
  {
    id: 'completed',
    title: 'Hoàn thành',
    color: 'bg-green-500',
    count: 0
  },
  {
    id: 'cancelled',
    title: 'Hủy bỏ',
    color: 'bg-red-500',
    count: 0
  }
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ orders, onOrderUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Phân loại đơn hàng theo cột (đã cập nhật logic)
  const getOrdersByColumn = (columnId: string) => {
    switch (columnId) {
      case 'pending':
        return orders.filter(order => order.status === OrderStatus.pending);
      case 'preparing':
        // Đơn hàng đã xác nhận, đang chuẩn bị
        return orders.filter(
          order =>
            order.status === OrderStatus.confirmed &&
            (!order.deliveryStatus || order.deliveryStatus === DeliveryStatus.not_shipped)
        );
      case 'shipping':
        return orders.filter(order => order.deliveryStatus === DeliveryStatus.in_transit);
      case 'completed':
        return orders.filter(order => order.status === OrderStatus.completed);
      case 'cancelled':
        return orders.filter(order => order.status === OrderStatus.canceled);
      default:
        return [];
    }
  };

  // Cập nhật số lượng cho mỗi cột
  const columnsWithCount = KANBAN_COLUMNS.map(column => ({
    ...column,
    count: getOrdersByColumn(column.id).length
  }));

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    setIsLoading(true);

    try {
      const orderId = draggableId;
      const newColumnId = destination.droppableId;

      // Xác định trạng thái mới dựa trên cột đích
      let newStatus: OrderStatus = OrderStatus.pending;
      let newDeliveryStatus: DeliveryStatus = DeliveryStatus.not_shipped;

      switch (newColumnId) {
        case 'pending':
          newStatus = OrderStatus.pending;
          newDeliveryStatus = DeliveryStatus.not_shipped;
          break;
        case 'preparing':
          newStatus = OrderStatus.confirmed;
          newDeliveryStatus = DeliveryStatus.not_shipped;
          break;
        case 'shipping':
          newStatus = OrderStatus.confirmed;
          newDeliveryStatus = DeliveryStatus.in_transit;
          break;
        case 'completed':
          newStatus = OrderStatus.completed;
          newDeliveryStatus = DeliveryStatus.delivered;
          break;
        case 'cancelled':
          newStatus = OrderStatus.canceled;
          break;
      }

      // Gọi API cập nhật trạng thái
      await Promise.all([
        axios.put(`/api/order/${orderId}`, { status: newStatus }),
        axios.put('/api/order', { id: orderId, deliveryStatus: newDeliveryStatus })
      ]);

      toast.success('Cập nhật đơn hàng thành công');
      onOrderUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Có lỗi xảy ra khi cập nhật đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='p-4 '>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Container với chiều cao cố định và scrollbar bên trong */}
        <div className='h-[calc(90.1vh-120px)] overflow-x-auto overflow-y-hidden rounded-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
          <div className='flex gap-3 min-w-max h-full'>
            {columnsWithCount.map(column => (
              <div key={column.id} className='flex-shrink-0 w-72'>
                <KanbanColumn id={column.id} title={column.title} color={column.color} count={column.count}>
                  <Droppable droppableId={column.id}>
                    {(provided: any, snapshot: any) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-transparent'
                        }`}
                      >
                        {getOrdersByColumn(column.id).map((order, index) => (
                          <Draggable key={order.id} draggableId={order.id} index={index} isDragDisabled={isLoading}>
                            {(provided: any, snapshot: any) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-3 ${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}`}
                              >
                                <KanbanCard order={order} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </KanbanColumn>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
