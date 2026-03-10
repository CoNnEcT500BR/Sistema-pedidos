import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AdminPage } from '@/routes/admin/AdminPage';
import { CartPage } from '@/routes/kiosk/CartPage';
import { CategoriesPage } from '@/routes/kiosk/CategoriesPage';
import { CheckoutPage } from '@/routes/kiosk/CheckoutPage';
import { ConfirmationPage } from '@/routes/kiosk/ConfirmationPage';
import { MenuItemsPage } from '@/routes/kiosk/MenuItemsPage';
import { SplashScreen } from '@/routes/kiosk/SplashScreen';
import { StaffPage } from '@/routes/staff/StaffPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/kiosk" replace /> },
  { path: '/kiosk', element: <SplashScreen /> },
  { path: '/kiosk/menu', element: <CategoriesPage /> },
  { path: '/kiosk/menu/:categoryId', element: <MenuItemsPage /> },
  { path: '/kiosk/cart', element: <CartPage /> },
  { path: '/kiosk/checkout', element: <CheckoutPage /> },
  { path: '/kiosk/confirmation/:orderNumber', element: <ConfirmationPage /> },
  { path: '/staff', element: <StaffPage /> },
  { path: '/admin', element: <AdminPage /> },
]);
