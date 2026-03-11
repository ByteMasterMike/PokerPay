export const DEFAULT_CHIP_DENOMINATIONS = [
  { color: '#FFFFFF', label: 'White', value: 1 },
  { color: '#E53E3E', label: 'Red', value: 5 },
  { color: '#38A169', label: 'Green', value: 25 },
  { color: '#3182CE', label: 'Blue', value: 50 },
  { color: '#1A202C', label: 'Black', value: 100 },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'var(--color-success)';
    case 'CLOSED':
      return 'var(--color-error)';
    case 'ACTIVE':
      return 'var(--color-success)';
    case 'CASHED_OUT':
      return 'var(--color-muted)';
    default:
      return 'var(--color-text-secondary)';
  }
}
