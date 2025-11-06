import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { maskCardNumber } from '../utils/mask';

// Card number length limits (ISO/IEC 7812)
const MIN_CARD_NUMBER_LENGTH = 12;
const MAX_CARD_NUMBER_LENGTH = 19;

export function validateRoute(req: Request, res: Response): void {
  const rawNumber = req.body.number;

  if (typeof rawNumber !== 'string') {
    logger.warn('Received request with non-string number field.', { error: 'Invalid input format' });
    res.status(400).json({ error: 'Input must be a string field "number".' });
    return;
  }

  try {
    const cardNumber = sanitizeInput(rawNumber);
    const maskedNumber = maskCardNumber(cardNumber);
    logger.info('Processing card validation request.', { number: maskedNumber });

    const isLuhnValid = luhnCheck(cardNumber);
    if (!isLuhnValid) {
      logger.warn('Validation failed: Luhn check failed.', { number: maskedNumber, valid: false });
      res.status(400).json({ 
        valid: false, 
        scheme: getScheme(cardNumber), 
        message: 'Luhn algorithm check failed.' 
      });
      return;
    }

    const scheme = getScheme(cardNumber);
    logger.info('Card successfully validated.', { number: maskedNumber, scheme, valid: true });
    res.status(200).json({
      valid: true,
      scheme,
      message: 'OK',
    });
  } catch (error) {
    const maskedNumber = typeof rawNumber === 'string' ? maskCardNumber(rawNumber.replace(/[\s-]/g, '')) : 'N/A';
    logger.error('Validation failed: Invalid input.', { number: maskedNumber, error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message || 'Invalid input' });
  }
}

function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Missing or invalid "number" field');
  }

  const cleaned = input.replace(/[\s-]/g, '');
  if (cleaned.length === 0 || cleaned.length < MIN_CARD_NUMBER_LENGTH || cleaned.length > MAX_CARD_NUMBER_LENGTH || !/^\d+$/.test(cleaned)) {
    if (cleaned.length === 0) {
      throw new Error('Missing or invalid "number" field');
    }
    throw new Error('Card number must contain 12 to 19 digits after cleanup.');
  }

  return cleaned;
}

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let double = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

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
