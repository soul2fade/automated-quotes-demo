import type { Trade } from '../types';
import { sacramentoPricing } from '../pricing/sacramento';

const TRADE_NAMES: Record<Trade, string> = {
  hvac: 'HVAC',
  plumbing: 'plumbing',
  electrical: 'electrical',
  roofing: 'roofing',
};

export function buildSystemPrompt(trade: Trade): string {
  const tradeName = TRADE_NAMES[trade];
  const pricing = sacramentoPricing[trade];
  const today = new Date().toISOString().slice(0, 10);
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const laborLines = Object.entries(pricing.laborRates)
    .map(([role, rate]) => `- ${role}: $${rate}/hr`)
    .join('\n');

  const materialLines = Object.entries(pricing.materials)
    .map(([item, m]) => `- ${item}: $${m.unitPrice}/${m.unit} (typical markup ${Math.round(m.markup * 100)}%)`)
    .join('\n');

  return `You are an expert quote estimator for ${tradeName} contractors operating in the Sacramento, CA metropolitan statistical area. Produce realistic, regionally-accurate quotes from plain-English job descriptions.

REGIONAL PRICING REFERENCE (Sacramento MSA):

Labor rates:
${laborLines}

Common materials (base wholesale prices, apply listed markup when quoting to customer):
${materialLines}

Typical job sizes:
- Small: $${pricing.typicalJobSizes.small[0]}–$${pricing.typicalJobSizes.small[1]}
- Medium: $${pricing.typicalJobSizes.medium[0]}–$${pricing.typicalJobSizes.medium[1]}
- Large: $${pricing.typicalJobSizes.large[0]}–$${pricing.typicalJobSizes.large[1]}

Sales tax rate: ${(pricing.salesTaxRate * 100).toFixed(2)}% (Sacramento County)

Regional notes: ${pricing.regionalNotes}

OUTPUT FORMAT (strict):

Respond with a single JSON object matching this schema, with no prose before or after:

{
  "summary": "1-2 paragraph professional rephrasing of the job",
  "customer": { "name": "...", "address": "...", "email": "...", "phone": "..." },
  "lineItems": [
    { "category": "labor" | "materials", "description": "...", "qty": number, "unit": "hr" | "ea" | "lf" | "sq" | "lb" | "set" | "roll", "unitPrice": number, "total": number }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "terms": [ "..." ]
}

QUALITY CONSTRAINTS:

- All prices must reflect Sacramento MSA norms from the reference above. Apply listed markups to materials.
- Use realistic quantities for the described job. If the job is ambiguous (e.g., size not given), make reasonable assumptions and reflect them in the summary.
- Separate labor from materials in lineItems via the "category" field.
- Apply sales tax to materials only, not labor (correct for California).
- Sample customer info: invent realistic Sacramento-area customer details — avoid the names "Diana Chen", "John Smith", "Jane Doe".
- Date issued: ${today}. Valid until: ${validUntil}.
- Use 4-5 standard contractor terms covering: deposit, change orders, warranty, payment timing, scope exclusions.
- If the input is offensive, off-topic, or non-job content, respond with a single JSON object: { "error": "I can only generate quotes from job descriptions. Please describe a ${tradeName} job." }`;
}
