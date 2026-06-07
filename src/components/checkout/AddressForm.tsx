import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  full_name:    z.string().min(2, 'Full name is required'),
  phone:        z.string().min(10, 'Phone must be at least 10 digits').max(15),
  city:         z.string().min(2, 'City is required'),
  subcity:      z.string().min(2, 'Subcity / area is required'),
  woreda:       z.string().optional(),
  house_number: z.string().optional(),
  notes:        z.string().optional(),
});

export type AddressData = z.infer<typeof schema>;

interface AddressFormProps {
  onSubmit: (data: AddressData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const AddressForm = ({ onSubmit, onCancel, loading }: AddressFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<AddressData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Delivery Address</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Where should we deliver your order?</p>
      </div>

      <Input
        label="Full Name"
        placeholder="e.g. Abebe Bekele"
        {...register('full_name')}
        error={errors.full_name?.message}
      />

      <Input
        label="Phone Number"
        placeholder="e.g. 0911234567"
        type="tel"
        {...register('phone')}
        error={errors.phone?.message}
      />

      <Input
        label="City"
        placeholder="e.g. Addis Ababa"
        {...register('city')}
        error={errors.city?.message}
      />

      <Input
        label="Subcity / Area"
        placeholder="e.g. Bole, Kirkos, Yeka"
        {...register('subcity')}
        error={errors.subcity?.message}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Woreda (optional)"
          placeholder="e.g. 03"
          {...register('woreda')}
        />
        <Input
          label="House No. (optional)"
          placeholder="e.g. 123"
          {...register('house_number')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Delivery Notes (optional)
        </label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Landmark, gate color, special instructions…"
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Back
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Continue to Payment
        </Button>
      </div>
    </form>
  );
};
