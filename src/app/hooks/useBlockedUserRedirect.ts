'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface User {
  isBlocked?: boolean;
  shouldRedirectToBlocked?: boolean;
  role?: string;
}

export const useBlockedUserRedirect = (user: User | null) => {
  const router = useRouter();

  useEffect(() => {
    // Check if user is blocked and should be redirected
    if (user?.shouldRedirectToBlocked && user?.isBlocked && user?.role !== 'ADMIN') {
      // Sign out user và redirect đến trang blocked
      signOut({ redirect: false }).then(() => {
        router.push('/account-blocked');
      });
    }
  }, [user, router]);
};
