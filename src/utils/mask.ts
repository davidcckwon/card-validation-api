/**
 * Masks card number, showing only last 4 digits
 */
export function maskCardNumber(number: string): string {
  if (number.length <= 4) return number;
  return 'X'.repeat(number.length - 4) + number.slice(-4);
}

