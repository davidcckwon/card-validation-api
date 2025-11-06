/**
 * Masks a card number, showing only the last 4 digits.
 * @param number The card number string.
 * @returns The masked string.
 */
export function maskCardNumber(number: string): string {
  if (number.length <= 4) return number;
  return 'X'.repeat(number.length - 4) + number.slice(-4);
}

