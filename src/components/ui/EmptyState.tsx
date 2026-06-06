import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
    {icon && (
      <div className="text-4xl text-zinc-300 dark:text-zinc-600">{icon}</div>
    )}
    <p className="font-semibold text-zinc-700 dark:text-zinc-300">{title}</p>
    {description && (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">{description}</p>
    )}
    {action}
  </div>
);
