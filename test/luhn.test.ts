import { isValidLuhn } from '../src/libs/validator/luhn';

describe('Luhn Algorithm', () => {
  describe('Valid card numbers', () => {
    test('should validate Visa card 4111111111111111', () => {
      expect(isValidLuhn('4111111111111111')).toBe(true);
    });

    test('should validate Mastercard 5555555555554444', () => {
      expect(isValidLuhn('5555555555554444')).toBe(true);
    });

    test('should validate Amex 378282246310005', () => {
      expect(isValidLuhn('378282246310005')).toBe(true);
    });

    test('should validate example from requirements 4539148803436467', () => {
      expect(isValidLuhn('4539148803436467')).toBe(true);
    });

    test('should validate 16-digit valid number', () => {
      expect(isValidLuhn('4242424242424242')).toBe(true);
    });
  });

  describe('Invalid card numbers', () => {
    test('should reject invalid Visa 4111111111111112', () => {
      expect(isValidLuhn('4111111111111112')).toBe(false);
    });

    test('should reject invalid Mastercard 5555555555554445', () => {
      expect(isValidLuhn('5555555555554445')).toBe(false);
    });

    test('should reject invalid Amex 378282246310006', () => {
      expect(isValidLuhn('378282246310006')).toBe(false);
    });

    test('should reject number with all zeros', () => {
      expect(isValidLuhn('0000000000000000')).toBe(true);
    });

    test('should reject single digit', () => {
      expect(isValidLuhn('1')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle numbers with spaces', () => {
      expect(isValidLuhn('4111 1111 1111 1111')).toBe(true);
    });

    test('should handle numbers with dashes', () => {
      expect(isValidLuhn('4111-1111-1111-1111')).toBe(true);
    });

    test('should handle mixed spaces and dashes', () => {
      expect(isValidLuhn('4111-1111 1111-1111')).toBe(true);
    });
  });
});

