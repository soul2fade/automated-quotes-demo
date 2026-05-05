import type { Config, Context } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '../../src/lib/prompts';
import type { Trade } from '../../src/types';

const VALID_TRADES: Trade[] = ['hvac', 'plumbing', 'electrical', 'roofing'];

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: { trade?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { trade, description } = body;
  if (!trade || !description || !VALID_TRADES.includes(trade as Trade)) {
    return new Response(JSON.stringify({ error: 'Bad request: trade and description required' }), { status: 400 });
  }
  if (description.length > 4000) {
    return new Response(JSON.stringify({ error: 'Description too long (max 4000 chars)' }), { status: 400 });
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(trade as Trade);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const response = await client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Trade: ${trade}. Job description: ${description}` }],
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Anthropic call failed:', message);
        controller.enqueue(encoder.encode(JSON.stringify({ error: message })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};

export const config: Config = {
  path: '/api/quote',
};
