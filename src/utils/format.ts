/** Format price in Ethiopian Birr */
export const formatPrice = (amount: number): string =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
  }).format(amount);

/** Format a date string */
export const formatDate = (dateStr: string): string =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));

/** Capitalize first letter */
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

/** Truncate text with ellipsis */
export const truncate = (str: string, maxLength: number): string =>
  str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;

/** Order status label + color */
export const orderStatusMeta = (
  status: string,
): { label: string; color: string } => {
  const map: Record<string, { label: string; color: string }> = {
    pending:    { label: 'Pending',    color: 'text-yellow-500' },
    processing: { label: 'Processing', color: 'text-blue-500' },
    shipped:    { label: 'Shipped',    color: 'text-indigo-500' },
    delivered:  { label: 'Delivered',  color: 'text-green-500' },
    cancelled:  { label: 'Cancelled',  color: 'text-red-500' },
  };
  return map[status] ?? { label: status, color: 'text-gray-500' };
};

/** Payment status label + color */
export const paymentStatusMeta = (
  status: string,
): { label: string; color: string } => {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'Unpaid',  color: 'text-yellow-500' },
    paid:    { label: 'Paid',    color: 'text-green-500' },
    failed:  { label: 'Failed',  color: 'text-red-500' },
  };
  return map[status] ?? { label: status, color: 'text-gray-500' };
};
