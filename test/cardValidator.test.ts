import { validateCard, detectCardScheme } from '../src/libs/validator/cardValidator';

describe('Card Validator', () => {
  describe('Input sanitization', () => {
    test('should strip spaces from card number', () => {
      const result = validateCard('4111 1111 1111 1111');
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe('visa');
    });

    test('should strip dashes from card number', () => {
      const result = validateCard('4111-1111-1111-1111');
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe('visa');
    });

    test('should strip mixed spaces and dashes', () => {
      const result = validateCard('4111-1111 1111-1111');
      expect(result.valid).toBe(true);
    });
  });

  describe('Length validation', () => {
    test('should accept 12-digit card', () => {
      const result = validateCard('123456789012');
      expect(result.valid).toBeDefined();
    });

    test('should accept 19-digit card', () => {
      const result = validateCard('1234567890123456789');
      expect(result.valid).toBeDefined();
    });

    test('should reject 11-digit card', () => {
      const result = validateCard('12345678901');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('12-19 digits');
    });

    test('should reject 20-digit card', () => {
      const result = validateCard('12345678901234567890');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('12-19 digits');
    });

    test('should reject empty string', () => {
      const result = validateCard('');
      expect(result.valid).toBe(false);
    });

    test('should reject non-numeric characters', () => {
      const result = validateCard('4111-1111-1111-111a');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('digits');
    });
  });

  describe('Luhn validation', () => {
    test('should validate correct Luhn number', () => {
      const result = validateCard('4111111111111111');
      expect(result.valid).toBe(true);
      expect(result.message).toBe('OK');
    });

    test('should reject incorrect Luhn number', () => {
      const result = validateCard('4111111111111112');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('invalid');
    });
  });

  describe('Card scheme detection', () => {
    test('should detect Visa (starts with 4)', () => {
      const result = validateCard('4111111111111111');
      expect(result.scheme).toBe('visa');
    });

    test('should detect Mastercard (51-55)', () => {
      const result = validateCard('5555555555554444');
      expect(result.scheme).toBe('mastercard');
    });

    test('should detect Amex (34 or 37)', () => {
      const result = validateCard('378282246310005');
      expect(result.scheme).toBe('amex');
    });

    test('should return unknown for unrecognized scheme', () => {
      const result = validateCard('6011111111111111');
      expect(result.scheme).toBe('unknown');
    });
  });
});

describe('detectCardScheme', () => {
  test('should detect Visa', () => {
    expect(detectCardScheme('4111111111111111')).toBe('visa');
    expect(detectCardScheme('4539148803436467')).toBe('visa');
  });

  test('should detect Mastercard', () => {
    expect(detectCardScheme('5555555555554444')).toBe('mastercard');
    expect(detectCardScheme('5105105105105100')).toBe('mastercard');
  });

  test('should detect Amex', () => {
    expect(detectCardScheme('378282246310005')).toBe('amex');
    expect(detectCardScheme('341111111111111')).toBe('amex');
  });

  test('should return unknown for other schemes', () => {
    expect(detectCardScheme('6011111111111111')).toBe('unknown');
    expect(detectCardScheme('30569309025904')).toBe('unknown');
  });
});

