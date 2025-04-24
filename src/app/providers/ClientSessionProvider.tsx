'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

interface ClientSessionProviderProps {
	session: Session | null;
	children: React.ReactNode;
}

const ClientSessionProvider: React.FC<ClientSessionProviderProps> = ({ session, children }) => {
	return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default ClientSessionProvider;
