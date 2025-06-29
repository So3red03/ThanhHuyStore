import React from 'react';
import { Dialog, DialogContent, IconButton, DialogTitle, Box, Typography } from '@mui/material';
import { MdClose } from 'react-icons/md';

interface AdminModalProps {
  isOpen: boolean;
  handleClose: () => void;
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, handleClose, children, title, icon, maxWidth = 'md' }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxHeight: '95vh',
          position: 'relative'
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }}
    >
      {/* Header with Title and Close Button */}
      {title && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {icon && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  backgroundColor: '#64748b',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {icon}
              </Box>
            )}
            <Typography variant='h6' fontWeight={600}>
              {title}
            </Typography>
          </Box>

          <IconButton
            onClick={handleClose}
            sx={{
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                color: '#475569'
              }
            }}
          >
            <MdClose size={20} />
          </IconButton>
        </DialogTitle>
      )}

      {/* Close Button for modals without title */}
      {!title && (
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#64748b',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
              color: '#475569'
            },
            width: 40,
            height: 40
          }}
        >
          <MdClose size={20} />
        </IconButton>
      )}

      <DialogContent
        sx={{
          p: title ? 3 : 0,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '3px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8'
          }
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default AdminModal;
