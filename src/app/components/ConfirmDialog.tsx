import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React, { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  handleClose: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
  alert?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  handleClose,
  children,
  onConfirm,
  alert = false,
  isLoading = false,
  loadingText = 'Đang xử lý...'
}) => {
  return (
    <>
      {alert ? (
        <Dialog
          open={isOpen}
          onClose={handleClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <div className='w-[442px]'></div>
          <DialogTitle id='alert-dialog-title' className='flex justify-center flex-col items-center'>
            <div className='flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#fdd835]'>
              <span className='text-[#fdd835] text-3xl'>!</span>
            </div>
            <span className='font-semibold text-base mt-7 '>THÔNG BÁO</span>
          </DialogTitle>
          <DialogContent className='text-center'>
            <DialogContentText id='alert-dialog-description'>{children}</DialogContentText>
          </DialogContent>
          <DialogActions className='flex justify-center items-center px-5'>
            <button
              onClick={handleClose}
              className='bg-[#ececec] border-[#ececec] px-5 py-3 mb-2 font-semibold text-sm transform-none rounded flex-1 hover:opacity-80'
            >
              Thoát
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className='px-5 py-3 mb-2 bg-slate-600 border-slate-600 text-white font-semibold text-sm transform-none rounded flex-1 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? loadingText : 'Đăng nhập'}
            </button>
          </DialogActions>
        </Dialog>
      ) : (
        <Dialog
          open={isOpen}
          onClose={handleClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <div className='w-[442px]'></div>
          <DialogTitle id='alert-dialog-title' className='flex justify-center flex-col items-center'>
            <div className='flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#fdd835]'>
              <span className='text-[#fdd835] text-3xl'>!</span>
            </div>
            <span className='font-semibold text-base mt-7 '>CẢNH BÁO</span>
          </DialogTitle>
          <DialogContent className='text-center'>
            <DialogContentText id='alert-dialog-description'>
              {children || 'Bạn có xác nhận xóa không'}
            </DialogContentText>
          </DialogContent>
          <DialogActions className='flex justify-center items-center px-5'>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className='bg-[#ececec] border-[#ececec] px-5 py-3 mb-2 font-semibold text-sm transform-none rounded flex-1 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Thoát
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className='px-5 py-3 mb-2 bg-slate-600 border-slate-600 text-white font-semibold text-sm transform-none rounded flex-1 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? loadingText : 'Xác nhận'}
            </button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default ConfirmDialog;
