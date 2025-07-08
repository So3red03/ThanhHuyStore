'use client';

import React from 'react';
import { Dialog, DialogContent, IconButton, Fade, Slide } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { SafeUser } from '../../../../types';
import { useAuthModal } from './useAuthModal';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import PasswordRecoveryModal from './PasswordRecoveryModal';
import EmailVerificationModal from './EmailVerificationModal';

interface AuthModalProps {
  currentUser: SafeUser | null | undefined;
}

const AuthModal: React.FC<AuthModalProps> = ({ currentUser }) => {
  const { isOpen, modalType, closeModal } = useAuthModal();

  const handleClose = () => {
    closeModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'login':
        return <LoginModal currentUser={currentUser} />;
      case 'register':
        return <RegisterModal currentUser={currentUser} />;
      case 'passwordRecovery':
        return <PasswordRecoveryModal />;
      case 'emailVerification':
        return <EmailVerificationModal currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          position: 'relative',
          maxWidth: '500px',
          margin: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'transparent',
          backdropFilter: 'none'
        }
      }}
      TransitionComponent={Fade}
      transitionDuration={300}
      onKeyDown={handleKeyDown}
    >
      <DialogContent
        sx={{
          padding: 0,
          position: 'relative',
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
        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
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

        {/* Modal Content with Slide Transition */}
        <Slide direction='up' in={isOpen && modalType !== null} timeout={200} mountOnEnter unmountOnExit>
          <div>{renderModalContent()}</div>
        </Slide>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
