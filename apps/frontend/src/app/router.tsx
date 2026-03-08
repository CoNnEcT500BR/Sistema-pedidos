import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AdminPage } from '@/routes/admin/AdminPage';
import { KioskPage } from '@/routes/kiosk/KioskPage';
import { StaffPage } from '@/routes/staff/StaffPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/kiosk" replace /> },
  { path: '/kiosk', element: <KioskPage /> },
  { path: '/staff', element: <StaffPage /> },
  { path: '/admin', element: <AdminPage /> },
]);
