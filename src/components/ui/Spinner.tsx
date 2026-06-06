import { cn } from '@/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export const Spinner = ({ size = 'md', className }: SpinnerProps) => (
  <div
    className={cn(
      'border-2 border-current border-t-transparent rounded-full',
      'animate-spin',
      sizeMap[size],
      className,
    )}
    role="status"
    aria-label="Loading"
  />
);
