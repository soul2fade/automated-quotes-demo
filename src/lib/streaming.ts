import { parse, Allow } from 'partial-json';
import type { Quote, Trade } from '../types';

type PartialQuote = Partial<Quote> & { error?: string };

export function parsePartialQuote(text: string): PartialQuote | null {
  if (!text.trim()) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    // Strip opening fence with optional language tag (```json, ```)
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
    // Strip trailing fence if present
    cleaned = cleaned.replace(/\n?```\s*$/, '');
  }
  if (!cleaned.trim()) return null;
  try {
    const obj = parse(cleaned, Allow.ALL);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj as PartialQuote;
    }
    return null;
  } catch {
    return null;
  }
}

export async function* streamQuote(
  trade: Trade,
  description: string,
  signal: AbortSignal
): AsyncGenerator<PartialQuote, void, void> {
  const resp = await fetch('/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trade, description }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`HTTP ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastYieldedLength = -1;

  const tryYield = function* () {
    if (buffer.length === lastYieldedLength) return;
    const partial = parsePartialQuote(buffer);
    if (partial) {
      lastYieldedLength = buffer.length;
      yield partial;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    yield* tryYield();
  }

  buffer += decoder.decode();
  yield* tryYield();
}
