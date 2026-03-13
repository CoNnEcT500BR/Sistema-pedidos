import { Navigate, createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AdminPage } from '@/routes/admin/AdminPage';
import { CartPage } from '@/routes/kiosk/CartPage';
import { CategoriesPage } from '@/routes/kiosk/CategoriesPage';
import { CheckoutPage } from '@/routes/kiosk/CheckoutPage';
import { ConfirmationPage } from '@/routes/kiosk/ConfirmationPage';
import { KioskLayout } from '@/routes/kiosk/KioskLayout';
import { MenuItemsPage } from '@/routes/kiosk/MenuItemsPage';
import { SplashScreen } from '@/routes/kiosk/SplashScreen';
import { LoginPage } from '@/routes/staff/LoginPage';
import { NewOrderPage } from '@/routes/staff/NewOrderPage';
import { StaffLayout } from '@/routes/staff/StaffLayout';
import { TouchOrderPage } from '@/routes/staff/TouchOrderPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/kiosk" replace /> },
  {
    path: '/kiosk',
    element: <KioskLayout />,
    children: [
      { index: true, element: <SplashScreen /> },
      { path: 'menu', element: <CategoriesPage /> },
      { path: 'menu/:categoryId', element: <MenuItemsPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'confirmation/:orderNumber', element: <ConfirmationPage /> },
    ],
  },
  { path: '/staff/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <StaffLayout />,
        children: [
          { path: '/staff', element: <Navigate to="/staff/classic" replace /> },
          { path: '/staff/classic', element: <NewOrderPage /> },
          { path: '/staff/touch', element: <TouchOrderPage /> },
        ],
      },
    ],
  },
  { path: '/admin', element: <AdminPage /> },
]);

