import { parse, Allow } from 'partial-json';
import type { Quote } from '../types';

type PartialQuote = Partial<Quote> & { error?: string };

export function parsePartialQuote(text: string): PartialQuote | null {
  if (!text.trim()) return null;
  try {
    const obj = parse(text, Allow.ALL);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj as PartialQuote;
    }
    return null;
  } catch {
    return null;
  }
}

export async function* streamQuote(
  trade: string,
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

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const partial = parsePartialQuote(buffer);
    if (partial) yield partial;
  }

  const final = parsePartialQuote(buffer);
  if (final) yield final;
}
