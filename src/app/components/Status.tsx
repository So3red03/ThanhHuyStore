import { IconType } from 'react-icons';

interface StatusProps {
  text: string;
  icon?: IconType;
  bg: string;
  color: string;
}

const Status: React.FC<StatusProps> = ({ text, icon: Icon, bg, color }) => {
  return (
    <div className={`${bg} ${color} flex items-center gap-x-1 py-1.5 px-2 rounded-full text-xs font-medium`}>
      {text} {Icon && <Icon size={10} />}
    </div>
  );
};

export default Status;
