import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors',
            'border-zinc-200 text-zinc-900 placeholder:text-zinc-400',
            'focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10',
            'dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500',
            'dark:focus:border-zinc-400',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/10',
            leftIcon ? 'pl-10' : undefined,
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  ),
);

Input.displayName = 'Input';
