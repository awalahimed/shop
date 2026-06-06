import { useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { initTelegram, tg } from '@/lib/telegram';
import { syncTelegramUser } from '@/services/auth';
import { useUserStore } from '@/store/useUserStore';
import { useThemeStore } from '@/store/useThemeStore';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/pages/admin/AdminLayout';

// Pages
import { HomePage }          from '@/pages/HomePage';
import { SearchPage }        from '@/pages/SearchPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage }          from '@/pages/CartPage';
import { OrdersPage }        from '@/pages/OrdersPage';
import { AdminDashboard }    from '@/pages/admin/AdminDashboard';
import { AdminProducts }     from '@/pages/admin/AdminProducts';
import { AdminOrders }       from '@/pages/admin/AdminOrders';

// Admin guard — only accessible if user.is_admin
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((s) => s.user);
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true,           element: <HomePage /> },
      { path: 'search',        element: <SearchPage /> },
      { path: 'product/:id',   element: <ProductDetailPage /> },
      { path: 'cart',          element: <CartPage /> },
      { path: 'orders',        element: <OrdersPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { index: true,          element: <AdminDashboard /> },
      { path: 'products',     element: <AdminProducts /> },
      { path: 'orders',       element: <AdminOrders /> },
    ],
  },
]);

export const App = () => {
  const { setUser, setLoading } = useUserStore();
  const { syncFromTelegram } = useThemeStore();

  useEffect(() => {
    // 1. Init Telegram WebApp
    initTelegram();

    // 2. Sync theme
    syncFromTelegram();

    // 3. Listen for Telegram theme changes
    const webapp = tg();
    const handleThemeChange = () => syncFromTelegram();
    webapp?.onEvent('themeChanged', handleThemeChange);

    // 4. Sync user to DB
    syncTelegramUser()
      .then((user) => {
        setUser(user);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => {
      webapp?.offEvent('themeChanged', handleThemeChange);
    };
  }, [setUser, setLoading, syncFromTelegram]);

  return <RouterProvider router={router} />;
};
