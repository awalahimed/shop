import type { Order } from '@/types';

/** Convert orders to CSV and trigger browser download */
export const exportOrdersToCsv = (orders: Order[]) => {
  const headers = [
    'Order ID', 'Date', 'Customer', 'Phone', 'City', 'Subcity',
    'Items', 'Total (ETB)', 'Payment Status', 'Order Status',
  ];

  const rows = orders.map((order) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (order as any).user;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addr = (order as any).delivery_address;
    const items = (order.items ?? [])
      .map((i) => `${(i.product as unknown as { name?: string })?.name ?? 'Product'} x${i.quantity} (${i.size})`)
      .join(' | ');

    return [
      order.id.slice(0, 8).toUpperCase(),
      new Date(order.created_at).toLocaleDateString('en-GB'),
      `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim(),
      addr?.phone ?? '',
      addr?.city ?? '',
      addr?.subcity ?? '',
      items,
      Number(order.total).toFixed(2),
      order.payment_status,
      order.order_status,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `union-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
