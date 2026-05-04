import { describe, it, expect } from 'vitest';
import { parsePartialQuote } from '../lib/streaming';

describe('parsePartialQuote', () => {
  it('returns null for empty or non-JSON input', () => {
    expect(parsePartialQuote('')).toBeNull();
    expect(parsePartialQuote('not json')).toBeNull();
  });

  it('parses a complete JSON object', () => {
    const json = '{"summary": "hello", "lineItems": [], "subtotal": 0, "tax": 0, "total": 0, "terms": []}';
    const result = parsePartialQuote(json);
    expect(result?.summary).toBe('hello');
  });

  it('parses a partial JSON object (missing closing brace)', () => {
    const partial = '{"summary": "hello", "lineItems": [{"description": "labor", "total": 100}';
    const result = parsePartialQuote(partial);
    expect(result?.summary).toBe('hello');
    expect(result?.lineItems?.[0]?.description).toBe('labor');
  });

  it('returns null on unrecoverable garbage', () => {
    expect(parsePartialQuote('}}}}}}')).toBeNull();
  });
});
