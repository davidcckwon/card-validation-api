import { Request, Response } from 'express';

// Industry standard card lengths (ISO/IEC 7812)
const MIN_CARD_NUMBER_LENGTH = 12;
const MAX_CARD_NUMBER_LENGTH = 19;

/**
 * POST /validate endpoint handler
 * Validates credit card numbers using Luhn algorithm
 * Returns 200 with validation result or 400 for bad input
 */
export function validateRoute(req: Request, res: Response): void {
  try {
    const { number } = req.body;

    // Step 1: Strip spaces/dashes and validate format (12-19 digits)
    const cardNumber = sanitizeInput(number);

    // Step 2: Validate using Luhn algorithm
    const isLuhnValid = luhnCheck(cardNumber);
    if (!isLuhnValid) {
      throw new Error('Card number is invalid (Luhn check failed)');
    }

    // Step 3: Detect card scheme (Visa/Mastercard/Amex/Discover)
    const scheme = getScheme(cardNumber);

    // Return success response
    res.status(200).json({
      valid: true,
      scheme,
      message: 'OK',
    });
  } catch (error) {
    // Return 400 for any validation errors
    res.status(400).json({ error: (error as Error).message || 'Invalid input' });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sanitizes and validates input
 * - Checks type is string
 * - Strips spaces/dashes before validating
 * - Only accepts 12-19 digits after cleanup
 */
function sanitizeInput(input: unknown): string {
  // Type check and length
  if (typeof input !== 'string' || input.length === 0) {
    throw new Error('Missing or invalid "number" field');
  }

  // Strip spaces and dashes
  const cleaned = input.replace(/[\s-]/g, '');

  // Validate contains only digits
  if (!/^\d+$/.test(cleaned)) {
    throw new Error('Card number must contain only digits');
  }

  // Validate length is within acceptable range
  if (cleaned.length < MIN_CARD_NUMBER_LENGTH || cleaned.length > MAX_CARD_NUMBER_LENGTH) {
    throw new Error('Card number must be between 12 and 19 digits');
  }

  return cleaned;
}

/**
 * Luhn algorithm implementation
 * Starting from rightmost digit, double every second digit
 * If doubling >= 10, subtract 9
 * Add up all digits
 * If total % 10 == 0, the number is valid
 */
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let double = false;

  // Process digits from right to left
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    // Double every second digit from the right
    if (double) {
      digit *= 2;
      // If doubling >= 10, subtract 9
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    double = !double;
  }

  // Valid if sum is divisible by 10
  return sum % 10 === 0;
}

/**
 * Detect card scheme from BIN (Bank Identification Number) prefix
 * Visa: starts with 4
 * Mastercard: 51-55 or 2221-2720
 * Amex: 34 or 37
 * Discover: 6011, 65, or 622126-622925
 */
function getScheme(cardNumber: string): string {
  const prefix2 = cardNumber.slice(0, 2);
  const prefix4 = cardNumber.slice(0, 4);
  const prefix6 = cardNumber.slice(0, 6);

  if (cardNumber.startsWith('4')) return 'visa';
  if ((prefix2 >= '51' && prefix2 <= '55') || (prefix4 >= '2221' && prefix4 <= '2720')) return 'mastercard';
  if (prefix2 === '34' || prefix2 === '37') return 'amex';
  if (prefix4 === '6011' || prefix2 === '65' || (prefix6 >= '622126' && prefix6 <= '622925')) return 'discover';
  return 'unknown';
}
