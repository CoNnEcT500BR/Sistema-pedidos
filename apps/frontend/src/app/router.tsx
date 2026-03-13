import { Navigate, createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AdminPage } from '@/routes/admin/AdminPage';
import { CartPage } from '@/routes/kiosk/CartPage';
import { CategoriesPage } from '@/routes/kiosk/CategoriesPage';
import { CheckoutPage } from '@/routes/kiosk/CheckoutPage';
import { ConfirmationPage } from '@/routes/kiosk/ConfirmationPage';
import { MenuItemsPage } from '@/routes/kiosk/MenuItemsPage';
import { SplashScreen } from '@/routes/kiosk/SplashScreen';
import { LoginPage } from '@/routes/staff/LoginPage';
import { NewOrderPage } from '@/routes/staff/NewOrderPage';
import { StaffLayout } from '@/routes/staff/StaffLayout';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/kiosk" replace /> },
  { path: '/kiosk', element: <SplashScreen /> },
  { path: '/kiosk/menu', element: <CategoriesPage /> },
  { path: '/kiosk/menu/:categoryId', element: <MenuItemsPage /> },
  { path: '/kiosk/cart', element: <CartPage /> },
  { path: '/kiosk/checkout', element: <CheckoutPage /> },
  { path: '/kiosk/confirmation/:orderNumber', element: <ConfirmationPage /> },
  { path: '/staff/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <StaffLayout />,
        children: [
          { path: '/staff', element: <NewOrderPage /> },
        ],
      },
    ],
  },
  { path: '/admin', element: <AdminPage /> },
]);

