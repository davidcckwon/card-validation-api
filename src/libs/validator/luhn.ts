export function isValidLuhn(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(cleaned) || cleaned.length < 2) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i] || '0', 10);

    if (isEven) {
      digit *= 2;
      if (digit >= 10) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

