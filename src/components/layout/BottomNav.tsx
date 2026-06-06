import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, ClipboardList } from '@/components/ui/icons';
import { useCartStore } from '@/store/useCartStore';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { to: '/',        icon: Home,          label: 'Home'   },
  { to: '/search',  icon: Search,        label: 'Search' },
  { to: '/cart',    icon: ShoppingCart,  label: 'Cart'   },
  { to: '/orders',  icon: ClipboardList, label: 'Orders' },
];

export const BottomNav = () => {
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-colors duration-150',
                isActive
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-400 dark:text-zinc-500',
              )
            }
          >
            <div className="relative">
              <Icon size={22} />
              {to === '/cart' && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold rounded-full">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
