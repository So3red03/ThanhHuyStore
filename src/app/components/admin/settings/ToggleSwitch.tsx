'use client';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  title,
  description,
  disabled = false
}) => {
  return (
    <div className='flex items-center justify-between'>
      <div>
        <h4 className='font-medium'>{title}</h4>
        <p className='text-sm text-gray-600'>{description}</p>
      </div>
      <label className='relative inline-flex items-center cursor-pointer'>
        <input
          type='checkbox'
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className='sr-only peer'
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
      </label>
    </div>
  );
};

export default ToggleSwitch;
