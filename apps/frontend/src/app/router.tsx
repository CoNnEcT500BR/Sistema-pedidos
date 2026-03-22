import { Navigate, createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AdminLayout } from '@/routes/admin/AdminLayout';
import { CategoriesPage as AdminCategoriesPage } from '@/routes/admin/CategoriesPage';
import { CombosPage } from '@/routes/admin/CombosPage';
import { DashboardPage } from '@/routes/admin/DashboardPage';
import { DeliveryPage } from '@/routes/admin/DeliveryPage';
import { LoginPage as AdminLoginPage } from '@/routes/admin/LoginPage';
import { MenuManagementPage } from '@/routes/admin/MenuManagementPage';
import { IngredientsPage } from '@/routes/admin/IngredientsPage';
import { OrdersBoardPage } from '@/routes/admin/OrdersBoardPage';
import { ReportsPage } from '@/routes/admin/ReportsPage';
import { UsersPage } from '@/routes/admin/UsersPage';
import { AuditPage } from '@/routes/admin/AuditPage';
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
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    element: (
      <ProtectedRoute requiredRoles={['ADMIN']} redirectTo="/admin/login" forbiddenRedirectTo="/staff/classic" />
    ),
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'menu', element: <MenuManagementPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'ingredients', element: <IngredientsPage /> },
          { path: 'combos', element: <CombosPage /> },
          { path: 'orders', element: <OrdersBoardPage /> },
          { path: 'delivery', element: <DeliveryPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'audit', element: <AuditPage /> },
          { path: 'reports', element: <ReportsPage /> },
        ],
      },
    ],
  },
]);

