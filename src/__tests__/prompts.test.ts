import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../lib/prompts';

describe('buildSystemPrompt', () => {
  it('mentions the selected trade by name', () => {
    expect(buildSystemPrompt('hvac')).toMatch(/HVAC/i);
    expect(buildSystemPrompt('plumbing')).toMatch(/plumbing/i);
  });

  it('includes Sacramento MSA reference', () => {
    expect(buildSystemPrompt('hvac')).toMatch(/Sacramento/);
  });

  it('includes labor rates from the pricing reference', () => {
    const prompt = buildSystemPrompt('hvac');
    expect(prompt).toMatch(/145/); // service rate
  });

  it('includes the JSON output schema constraint', () => {
    const prompt = buildSystemPrompt('hvac');
    expect(prompt).toMatch(/JSON/);
    expect(prompt).toMatch(/lineItems/);
  });

  it('instructs tax on materials only', () => {
    expect(buildSystemPrompt('hvac')).toMatch(/materials only|materials, not labor/i);
  });
});
