'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AuthModalType = 'login' | 'register' | 'passwordRecovery' | null;

interface AuthModalContextType {
  isOpen: boolean;
  modalType: AuthModalType;
  openModal: (type: AuthModalType) => void;
  closeModal: () => void;
  switchModal: (type: AuthModalType) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

interface AuthModalProviderProps {
  children: ReactNode;
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<AuthModalType>(null);

  const openModal = (type: AuthModalType) => {
    setModalType(type);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Delay resetting modalType to allow for smooth closing animation
    setTimeout(() => setModalType(null), 200);
  };

  const switchModal = (type: AuthModalType) => {
    setModalType(type);
    // Keep modal open when switching
  };

  const value = {
    isOpen,
    modalType,
    openModal,
    closeModal,
    switchModal,
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
