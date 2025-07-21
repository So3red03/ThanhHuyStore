'use client';

import dynamic from 'next/dynamic';
import { Box } from '@mui/material';

// Dynamic imports to prevent hydration mismatch
const AdminSideBarNew = dynamic(() => import('./AdminSideBarNew'), {
  ssr: false,
  loading: () => <div style={{ width: '280px', backgroundColor: '#f5f5f5' }} />
});

const AdminNavNew = dynamic(() => import('./AdminNavNew'), {
  ssr: false,
  loading: () => <div style={{ height: '80px', backgroundColor: '#fff' }} />
});

interface DynamicAdminLayoutProps {
  children: React.ReactNode;
  currentUser: any;
}

const DynamicAdminLayout: React.FC<DynamicAdminLayoutProps> = ({ children, currentUser }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Dynamic Sidebar */}
      <AdminSideBarNew currentUser={currentUser} />

      {/* Main Content Area */}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          overflow: 'auto',
          backgroundColor: 'background.default'
        }}
      >
        {/* Dynamic Navigation */}
        <AdminNavNew currentUser={currentUser} />

        {/* Page Content */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, xl: 3 },
            backgroundColor: 'primary.200',
            minHeight: 'calc(100vh - 80px)',
            overflow: 'auto'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DynamicAdminLayout;
