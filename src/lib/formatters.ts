// Number formatting utilities

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('default', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100 / 100);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('default', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('default', options).format(value);
}