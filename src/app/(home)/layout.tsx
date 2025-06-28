import '../globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import Navbar from '../components/nav/Navbar';
import Footer from '../components/footer/Footer';
import CartProvider from '../providers/CartProvider';
import { Toaster } from 'react-hot-toast';
import ZaloChatBtn from '../components/ZaloChatBtn';
import ChatBoxClient from '../components/chat/ChatBoxClient';
import { getSession } from 'next-auth/react';
import ClientSessionProvider from '../providers/ClientSessionProvider';
import { getCurrentUser } from '../actions/getCurrentUser';
import AnalyticsTracker from '../components/analytics/AnalyticsTracker';
import NProgressProvider from '../components/NProgressProvider';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'ThanhHuy Store - Apple shop chính hãng',
  icons: {
    icon: '/favicon.svg' // Đường dẫn tới favicon
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const currentUser = await getCurrentUser();
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>
      <body
        className={`${poppins.className} text-slate-700`}
        style={{ fontFamily: "'SF Pro Display', Arial, sans-serif" }}
      >
        <Toaster
          toastOptions={{
            style: {
              background: 'rgb(51 65 85)',
              color: '#fff'
            }
          }}
        />
        <ClientSessionProvider session={session}>
          <CartProvider>
            <AnalyticsTracker>
              <NProgressProvider />
              <div className='flex flex-col min-h-screen'>
                <Navbar />
                <main className='flex-grow'>{children}</main>
                <Footer />
                <ZaloChatBtn />
                <ChatBoxClient currentUser={currentUser} />
              </div>
            </AnalyticsTracker>
          </CartProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
