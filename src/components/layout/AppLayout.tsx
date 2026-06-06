import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export const AppLayout = () => (
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
    <Outlet />
    <BottomNav />
  </div>
);
