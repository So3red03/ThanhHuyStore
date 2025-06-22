import '../globals.css';
import '../styles/nprogress.css';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';
import AdminSideBar from '../components/admin/AdminSideBar';
import AdminNav from '../components/admin/AdminNav';
import ClientSessionProvider from '../providers/ClientSessionProvider';
import { getSession } from 'next-auth/react';
import { SidebarProvider } from '../providers/SidebarProvider';
import { getCurrentUser } from '../actions/getCurrentUser';
import { getArticlesCategory } from '../actions/getArticlesCategory';
import { getProductCategories, getSubCategories } from '../actions/getProductCategories';
export const metadata = {
  title: 'ThanhHuy Store - Dashboard',
  description: 'Apple Shop Admin Dashboard'
};
const inter = Inter({ subsets: ['latin'] });

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const currentUser = await getCurrentUser();
  const articleCategory = await getArticlesCategory();
  const parentCategory = await getProductCategories();
  const subCategories = await getSubCategories();
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
              background: 'rgb(51 65 85)',
              color: '#fff'
            }
          }}
        />
        {/* Lấy toàn bộ thông tin của user theo phiên hiện tại  */}
        <ClientSessionProvider session={session}>
          <SidebarProvider>
            <div className='flex min-h-screen'>
              <div className='shadow-md xl:w-[37vh] bg-slate-200'>
                <AdminSideBar />
              </div>
              <div className='flex-g-4 p-0 xl:px-5 xl:py-2 w-full'>
                <AdminNav
                  currentUser={currentUser}
                  articleCategory={articleCategory}
                  parentCategory={parentCategory}
                  subCategories={subCategories}
                />
                {children}
              </div>
            </div>
          </SidebarProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
