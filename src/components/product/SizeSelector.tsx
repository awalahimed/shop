import type { Size } from '@/types';
import { cn } from '@/utils/cn';

const SIZES: Size[] = ['S', 'M', 'L', 'XL'];

interface SizeSelectorProps {
  available: Size[];
  selected: Size | null;
  onChange: (size: Size) => void;
}

export const SizeSelector = ({ available, selected, onChange }: SizeSelectorProps) => (
  <div className="flex gap-2">
    {SIZES.map((size) => {
      const isAvailable = available.includes(size);
      const isSelected = selected === size;

      return (
        <button
          key={size}
          disabled={!isAvailable}
          onClick={() => onChange(size)}
          aria-pressed={isSelected}
          className={cn(
            'w-11 h-11 rounded-xl text-sm font-medium border transition-all duration-150 active:scale-95',
            isSelected
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
              : isAvailable
              ? 'border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-400'
              : 'border-zinc-100 text-zinc-300 cursor-not-allowed line-through dark:border-zinc-800 dark:text-zinc-600',
          )}
        >
          {size}
        </button>
      );
    })}
  </div>
);
