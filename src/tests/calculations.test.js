import { describe, it, expect } from 'vitest';
import {
  calculateTotalAssets,
  formatCurrency,
  formatDateTime,
  getCurrentTimestamp
} from '../utils/calculations';

describe('calculations.js Utilities', () => {

  describe('calculateTotalAssets', () => {
    it('should correctly calculate total assets with valid data', () => {
      // Arrange
      const items = [
        { warehouseQty: 10, lorryQty: 5, buyingPrice: 100 },
        { whQty: 20, lorryQty: 0, price: 50 },
      ];

      // Act
      const result = calculateTotalAssets(items);

      // Assert
      // Item 1: (10 + 5) * 100 = 1500
      // Item 2: (20 + 0) * 50 = 1000
      // Total = 2500
      expect(result).toBe(2500);
    });

    it('should return 0 when items array is empty', () => {
      // Arrange
      const items = [];

      // Act
      const result = calculateTotalAssets(items);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle undefined or null items safely', () => {
      // Act
      const resultNull = calculateTotalAssets(null);
      const resultUndefined = calculateTotalAssets(undefined);

      // Assert
      expect(resultNull).toBe(0);
      expect(resultUndefined).toBe(0);
    });

    it('should treat missing properties as 0', () => {
      // Arrange
      const items = [
        { warehouseQty: 10 } // missing lorryQty and buyingPrice/price
      ];

      // Act
      const result = calculateTotalAssets(items);

      // Assert
      // (10 + 0) * 0 = 0
      expect(result).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should correctly format a positive number', () => {
      // Arrange
      const value = 1234567.89;

      // Act
      const result = formatCurrency(value);

      // Assert
      expect(result).toMatch(/1,234,567\.89/);
    });

    it('should return 0.00 formatted string for 0', () => {
      // Arrange
      const value = 0;

      // Act
      const result = formatCurrency(value);

      // Assert
      expect(result).toMatch(/0\.00/);
    });

    it('should handle null or undefined safely', () => {
      // Act
      const resultNull = formatCurrency(null);
      const resultUndefined = formatCurrency(undefined);

      // Assert
      expect(resultNull).toMatch(/0\.00/);
      expect(resultUndefined).toMatch(/0\.00/);
    });
  });

  describe('formatDateTime', () => {
    it('should correctly format a valid ISO date string', () => {
      // Arrange
      const dateString = '2026-03-23T10:30:00Z'; // UTC time

      // Act
      const result = formatDateTime(dateString);

      // Assert
      // We are expecting standard 12 hour en-GB format with parts
      expect(result).toContain('23/03/2026');
      expect(result).toMatch(/(AM|PM)/i);
    });

    it('should handle invalid date string', () => {
      // Arrange
      const invalidDate = 'not-a-date';

      // Act
      const result = formatDateTime(invalidDate);

      // Assert
      expect(result).toBe('Invalid Date');
    });

    it('should return N/A for null or undefined', () => {
      // Act
      const resultNull = formatDateTime(null);
      const resultUndefined = formatDateTime(undefined);
      const resultEmpty = formatDateTime('');

      // Assert
      expect(resultNull).toBe('N/A');
      expect(resultUndefined).toBe('N/A');
      expect(resultEmpty).toBe('N/A');
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return a valid ISO string representing current time', () => {
      // Act
      const result = getCurrentTimestamp();
      const parsed = new Date(result);

      // Assert
      expect(typeof result).toBe('string');
      // The parsed date should be valid
      expect(parsed.toISOString() === result).toBe(true);
    });
  });

});
