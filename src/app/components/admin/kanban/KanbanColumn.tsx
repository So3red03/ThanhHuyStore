interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, color, count, children }) => {
  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col'>
      {/* Header */}
      <div className={`${color} text-white p-3 rounded-t-lg flex items-center justify-between flex-shrink-0`}>
        <h3 className='font-medium text-sm'>{title}</h3>
        <span className='bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium'>{count}</span>
      </div>

      {/* Content - scrollable */}
      <div className='p-2 flex-1 overflow-y-auto'>{children}</div>
    </div>
  );
};

export default KanbanColumn;
