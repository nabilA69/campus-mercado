/** Format a listing price. amount is in whole currency units; 0 => free label. */
export function formatPrice(
  amount: number,
  currency: string,
  freeLabel: string,
): string {
  if (amount <= 0) return freeLabel;
  return `${amount.toLocaleString("es")} ${currency}`;
}
