import { useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { initTelegram, tg } from '@/lib/telegram';
import { syncTelegramUser } from '@/services/auth';
import { useUserStore } from '@/store/useUserStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Spinner } from '@/components/ui/Spinner';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/pages/admin/AdminLayout';

// Pages
import { HomePage }          from '@/pages/HomePage';
import { SearchPage }        from '@/pages/SearchPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage }          from '@/pages/CartPage';
import { OrdersPage }        from '@/pages/OrdersPage';
import { AdminLogin }        from '@/pages/admin/AdminLogin';
import { AdminDashboard }    from '@/pages/admin/AdminDashboard';
import { AdminProducts }     from '@/pages/admin/AdminProducts';
import { AdminOrders }       from '@/pages/admin/AdminOrders';
import { AdminOrderDetail }  from '@/pages/admin/AdminOrderDetail';
import { AdminCustomers }    from '@/pages/admin/AdminCustomers';

// Admin guard — shows login page if not admin
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const user    = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" className="text-zinc-400" />
      </div>
    );
  }
  // Not admin → show login instead of redirecting away
  if (!user?.is_admin) return <AdminLogin />;
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
      { path: 'orders/:id',   element: <AdminOrderDetail /> },
      { path: 'customers',    element: <AdminCustomers /> },
    ],
  },
  // Redirect any unknown route to home
  { path: '*', element: <Navigate to="/" replace /> },
]);

export const App = () => {
  const { setUser, setLoading } = useUserStore();
  const { syncFromTelegram } = useThemeStore();

  useEffect(() => {
    initTelegram();
    syncFromTelegram();

    const webapp = tg();
    const handleThemeChange = () => syncFromTelegram();
    webapp?.onEvent('themeChanged', handleThemeChange);

    syncTelegramUser()
      .then((user) => setUser(user))
      .catch((err) => {
        console.error('User sync failed:', err);
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => {
      webapp?.offEvent('themeChanged', handleThemeChange);
    };
  }, [setUser, setLoading, syncFromTelegram]);

  return <RouterProvider router={router} />;
};
