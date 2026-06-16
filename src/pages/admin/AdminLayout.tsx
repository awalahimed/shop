import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useUserStore } from '@/store/useUserStore';
import {
  LayoutDashboard, Package, ClipboardList, Users,
  ShoppingBag, ArrowLeft, X,
} from '@/components/ui/icons';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard',  end: true },
      { to: '/admin/orders',    icon: ClipboardList,   label: 'Orders'               },
      { to: '/admin/products',  icon: Package,         label: 'Products'             },
      { to: '/admin/customers', icon: Users,           label: 'Customers'            },
    ],
  },
];

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const handleLogout = () => {
    setUser(null);
    navigate('/admin');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={15} className="text-zinc-900" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Union Shop</p>
            <p className="text-[10px] text-zinc-500 leading-tight">Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="p-1 text-zinc-500 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                      isActive
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={16}
                        className={cn('flex-shrink-0', isActive ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-300')}
                      />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-zinc-800 space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.first_name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{user.first_name} {user.last_name ?? ''}</p>
              <p className="text-[10px] text-zinc-600">Administrator</p>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={16} className="flex-shrink-0" />
          Back to Shop
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
        >
          <span className="text-base leading-none flex-shrink-0">⏻</span>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* ── Desktop sidebar (fixed, never scrolls) ── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 h-screen">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="flex-shrink-0 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-5">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors lg:hidden"
          >
            {/* Hamburger */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Breadcrumb placeholder */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-zinc-400 font-medium">Union Shop</span>
            <span>/</span>
            <span className="text-white">Admin</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-2 h-2 rounded-full bg-green-500" title="Online" />
            <span className="text-xs text-zinc-500 hidden sm:block">Live</span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
