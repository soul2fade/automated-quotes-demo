import { describe, it, expect } from 'vitest';
import { cannedQuotes } from '../data/canned-quotes';
import { TRADES } from '../types';

describe('cannedQuotes', () => {
  it('has a quote for every trade', () => {
    for (const { id } of TRADES) {
      expect(cannedQuotes[id]).toBeDefined();
    }
  });

  it('subtotals match the sum of line items', () => {
    for (const { id } of TRADES) {
      const q = cannedQuotes[id];
      const computed = q.lineItems.reduce((s, li) => s + li.total, 0);
      expect(Math.abs(computed - q.subtotal)).toBeLessThan(1);
    }
  });

  it('tax applies to materials only at 7.75%', () => {
    for (const { id } of TRADES) {
      const q = cannedQuotes[id];
      const materials = q.lineItems.filter((li) => li.category === 'materials').reduce((s, li) => s + li.total, 0);
      const expectedTax = Math.round(materials * 0.0775);
      expect(Math.abs(q.tax - expectedTax)).toBeLessThan(2);
    }
  });

  it('totals = subtotal + tax', () => {
    for (const { id } of TRADES) {
      const q = cannedQuotes[id];
      expect(Math.abs(q.subtotal + q.tax - q.total)).toBeLessThan(1);
    }
  });

  it('trade field on each quote matches its record key', () => {
    for (const { id } of TRADES) {
      expect(cannedQuotes[id].trade).toBe(id);
    }
  });
});
