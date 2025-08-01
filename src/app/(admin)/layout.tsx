import '../globals.css';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';
import ClientSessionProvider from '../providers/ClientSessionProvider';

import { SidebarProvider } from '../providers/SidebarProvider';
import { getCurrentUser } from '../actions/getCurrentUser';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { adminTheme } from '../theme/adminTheme';
import DynamicAdminLayout from '../components/admin/DynamicAdminLayout';
// Removed complex permission imports - using simple role check
import { redirect } from 'next/navigation';
// Auto-start AI Assistant monitoring
import '../libs/ai-assistant/autoStart';
export const metadata = {
  title: 'ThanhHuy Store - Dashboard',
  description: 'Apple Shop Admin Dashboard',
  icons: {
    icon: '/favicon.svg' // Đường dẫn tới favicon
  }
};
const inter = Inter({ subsets: ['latin'] });

// Layout content component that uses dynamic imports to prevent hydration mismatch
const LayoutContent = ({ children, currentUser }: { children: React.ReactNode; currentUser: any }) => {
  return <DynamicAdminLayout currentUser={currentUser}>{children}</DynamicAdminLayout>;
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  // Simple check: only ADMIN and STAFF can access admin panel
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
    redirect('/');
  }

  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>
      <body
        className={`${inter.className} text-slate-700`}
        style={{ fontFamily: "'SF Pro Display', Arial, sans-serif" }}
      >
        <Toaster
          toastOptions={{
            style: {
              background: '#2563eb',
              color: '#fff'
            }
          }}
        />
        {/* Professional MUI Theme Provider */}
        <ThemeProvider theme={adminTheme}>
          <CssBaseline />
          {/* Lấy toàn bộ thông tin của user theo phiên hiện tại  */}
          <ClientSessionProvider session={null}>
            <SidebarProvider>
              <LayoutContent currentUser={currentUser}>{children}</LayoutContent>
            </SidebarProvider>
          </ClientSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
