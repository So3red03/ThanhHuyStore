'use client';

import { useState } from 'react';
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment, IconButton } from '@mui/material';
import {
  MdVisibility,
  MdVisibilityOff,
  MdPerson,
  MdEmail,
  MdLock,
  MdPhone,
  MdAttachMoney,
  MdTitle,
  MdDescription,
  MdCategory,
  MdInventory,
  MdImage,
  MdDateRange,
  MdLink
} from 'react-icons/md';

interface InputProps {
  id: string;
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
  className?: string;
  defaultValue?: string | null;
  toggleVisibility?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  options?: any[];
  cartInfo?: boolean;
  autoComplete?: string;
  pattern?: string;
  title?: string;
}

// Helper function to get appropriate icon based on field id/type
const getFieldIcon = (id: string, type?: string) => {
  // Email fields
  if (type === 'email' || id.includes('email')) return MdEmail;

  // Password fields
  if (type === 'password' || id.includes('password')) return MdLock;

  // Phone fields
  if (type === 'tel' || id.includes('phone')) return MdPhone;

  // Price/Money fields
  if (id.includes('price') || id.includes('cost') || id.includes('amount')) return MdAttachMoney;

  // Name/Title fields
  if (id.includes('name') || id.includes('title')) return id.includes('title') ? MdTitle : MdPerson;

  // Description fields
  if (id.includes('description') || id.includes('content')) return MdDescription;

  // Category fields
  if (id.includes('category') || id.includes('cate')) return MdCategory;

  // Stock/Inventory fields
  if (id.includes('stock') || id.includes('quantity')) return MdInventory;

  // Image/URL fields
  if (id.includes('image') || id.includes('url') || id.includes('link')) return id.includes('image') ? MdImage : MdLink;

  // Date fields
  if (type === 'date' || id.includes('date') || id.includes('time')) return MdDateRange;

  // Default icon
  return MdPerson;
};

const Input: React.FC<InputProps> = ({
  id,
  label,
  placeholder,
  type,
  disabled,
  register,
  required,
  errors,
  defaultValue,
  toggleVisibility,
  onKeyDown,
  onInput,
  options,
  onChange,
  autoComplete
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleToggleVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Get appropriate icon for the field
  const FieldIcon = getFieldIcon(id, type);

  // Handle MUI TextField change
  const handleMuiChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(event);
  };

  // Handle MUI Select change
  const handleMuiSelectChange = (event: any) => {
    // Create a synthetic event for react-hook-form
    const syntheticEvent = {
      target: {
        name: id,
        value: event.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    if (onChange) onChange(syntheticEvent);
  };

  // Trả về các ràng buộc dựa trên type
  const validationRules = () => {
    if (type === 'email') {
      return { required, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ };
    }
    if (type === 'number') {
      return { required, min: 0 };
    }
    if (type === 'text') {
      return { required, minLength: 1 };
    }
    if (type === 'password') {
      return { required, minLength: 6 };
    }
    if (type === 'tel' || id === 'phone') {
      return {
        required,
        pattern: /^(\+84|84|0)?[0-9]{9,10}$/,
        minLength: 9,
        maxLength: 13
      };
    }
    return { required };
  };

  return (
    <div className='w-full'>
      {type === 'combobox' ? (
        <FormControl
          fullWidth
          error={!!errors[id]}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: errors[id] ? '#f87171' : '#cbd5e1',
                borderWidth: '2px'
              },
              '&:hover fieldset': {
                borderColor: errors[id] ? '#f87171' : '#94a3b8'
              },
              '&.Mui-focused fieldset': {
                borderColor: errors[id] ? '#f87171' : '#64748b',
                borderWidth: '2px'
              }
            },
            '& .MuiInputLabel-root': {
              color: errors[id] ? '#f87171' : '#64748b',
              '&.Mui-focused': {
                color: errors[id] ? '#f87171' : '#64748b'
              }
            }
          }}
        >
          <InputLabel>{label}</InputLabel>
          <Select
            {...register(id, { required })}
            defaultValue={defaultValue || ''}
            label={label}
            disabled={disabled}
            onChange={handleMuiSelectChange}
            startAdornment={
              <InputAdornment position='start'>
                <FieldIcon style={{ color: '#64748b', fontSize: '20px' }} />
              </InputAdornment>
            }
          >
            {options?.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <TextField
          fullWidth
          id={id}
          label={label}
          placeholder={placeholder}
          type={isPasswordVisible && type === 'password' ? 'text' : type}
          disabled={disabled}
          defaultValue={defaultValue || ''}
          error={!!errors[id]}
          autoComplete={autoComplete || 'off'}
          onKeyDown={onKeyDown}
          onInput={onInput}
          {...register(id, validationRules())}
          onChange={handleMuiChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <FieldIcon style={{ color: '#64748b', fontSize: '20px' }} />
              </InputAdornment>
            ),
            endAdornment:
              toggleVisibility && type === 'password' ? (
                <InputAdornment position='end'>
                  <IconButton onClick={handleToggleVisibility} edge='end' sx={{ color: '#64748b' }}>
                    {isPasswordVisible ? <MdVisibilityOff /> : <MdVisibility />}
                  </IconButton>
                </InputAdornment>
              ) : null
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: errors[id] ? '#f87171' : '#cbd5e1',
                borderWidth: '2px'
              },
              '&:hover fieldset': {
                borderColor: errors[id] ? '#f87171' : '#94a3b8'
              },
              '&.Mui-focused fieldset': {
                borderColor: errors[id] ? '#f87171' : '#64748b',
                borderWidth: '2px'
              }
            },
            '& .MuiInputLabel-root': {
              color: errors[id] ? '#f87171' : '#64748b',
              '&.Mui-focused': {
                color: errors[id] ? '#f87171' : '#64748b'
              }
            }
          }}
        />
      )}

      {/* Error Message */}
      {errors[id] && (
        <p className='text-rose-500 text-sm mt-1 ml-1'>{(errors[id]?.message as string) || `${label} là bắt buộc`}</p>
      )}
    </div>
  );
};

export default Input;
