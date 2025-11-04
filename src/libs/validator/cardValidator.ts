import { isValidLuhn } from './luhn';

export interface ValidationResult {
  valid: boolean;
  scheme: string;
  message: string;
}

export function detectCardScheme(cardNumber: string): string {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  const firstDigit = cleaned[0];
  const firstTwoDigits = cleaned.substring(0, 2);

  if (firstDigit === '4') {
    return 'visa';
  }
  if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
    return 'mastercard';
  }
  if (firstTwoDigits === '34' || firstTwoDigits === '37') {
    return 'amex';
  }

  return 'unknown';
}

export function validateCard(cardNumber: string): ValidationResult {
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      scheme: 'unknown',
      message: 'Card number must contain only digits'
    };
  }

  if (cleaned.length < 12 || cleaned.length > 19) {
    return {
      valid: false,
      scheme: 'unknown',
      message: 'Card number must be between 12-19 digits'
    };
  }

  if (!isValidLuhn(cleaned)) {
    return {
      valid: false,
      scheme: detectCardScheme(cleaned),
      message: 'Card number is invalid (Luhn check failed)'
    };
  }

  return {
    valid: true,
    scheme: detectCardScheme(cleaned),
    message: 'OK'
  };
}

export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  if (cleaned.length <= 4) {
    return '*'.repeat(cleaned.length);
  }
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

