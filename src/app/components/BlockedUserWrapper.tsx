'use client';

import { useBlockedUserRedirect } from '@/app/hooks/useBlockedUserRedirect';

interface BlockedUserWrapperProps {
  user: any;
  children: React.ReactNode;
}

const BlockedUserWrapper: React.FC<BlockedUserWrapperProps> = ({ user, children }) => {
  // Use hook to handle blocked user redirect
  useBlockedUserRedirect(user);

  // Render children normally
  return <>{children}</>;
};

export default BlockedUserWrapper;
