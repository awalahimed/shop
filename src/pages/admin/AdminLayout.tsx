import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, Users, ArrowLeft, ShoppingBag } from '@/components/ui/icons';
import { cn } from '@/utils/cn';

const NAV = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/admin/orders',    icon: ClipboardList,   label: 'Orders'               },
  { to: '/admin/products',  icon: Package,         label: 'Products'             },
  { to: '/admin/customers', icon: Users,           label: 'Customers'            },
];

export const AdminLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <ShoppingBag size={14} className="text-zinc-900" />
            </div>
            <span className="font-bold text-white text-sm">Union Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white text-zinc-900'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Back to shop */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors w-full"
          >
            <ArrowLeft size={16} />
            Back to Shop
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-zinc-950">
        <Outlet />
      </main>
    </div>
  );
};
