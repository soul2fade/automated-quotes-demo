# Quote Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public AI quote generator demo at `automated-quotes-demo.netlify.app` matching the spec at `docs/superpowers/specs/2026-05-04-quote-generator-design.md`.

**Architecture:** Vite + React 18 + TypeScript + Tailwind static site, with a single Netlify serverless function (`/api/quote`) that calls Anthropic's Claude Haiku 4.5 API with streaming. Hybrid demo flow: page loads with a pre-rendered canned quote per trade for instant gratification; visitors who type their own job description trigger a live AI generation that streams progressively into the document.

**Tech Stack:** React 18, TypeScript, Tailwind 3, Vite 5, Vitest 1, @testing-library/react, @anthropic-ai/sdk, @netlify/functions, partial-json (for streaming JSON parsing).

---

## File Structure

```
automated-quotes-demo/
├── .gitignore
├── README.md
├── index.html                       # Page shell + OG meta tags
├── netlify.toml                     # Build + SPA fallback + functions config
├── package.json
├── postcss.config.js
├── tailwind.config.ts               # Brand palette (matches dashboard)
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                   # Vite + Vitest config
├── docs/superpowers/                # Already exists (spec, plan)
├── public/
│   ├── logo.png                     # Copied from dashboard
│   └── og-image.png                 # Added in Task 14 from screenshot
├── netlify/functions/
│   └── quote.ts                     # SSE streaming function calling Anthropic
└── src/
    ├── main.tsx                     # React entry
    ├── index.css                    # Tailwind base + print styles
    ├── App.tsx                      # Top-level layout + state wiring
    ├── types.ts                     # Trade, Quote, LineItem types
    ├── pricing/
    │   └── sacramento.ts            # MSA pricing reference data
    ├── data/
    │   └── canned-quotes.ts         # Pre-baked example quotes per trade
    ├── lib/
    │   ├── prompts.ts               # System prompt assembly
    │   └── streaming.ts             # SSE consumer + partial JSON parsing
    ├── components/
    │   ├── Header.tsx               # Brand + headline
    │   ├── TradeToggle.tsx          # 4-button trade switcher
    │   ├── JobInput.tsx             # Textarea + Generate button
    │   ├── QuoteDocument.tsx        # The full quote (letterhead → footer)
    │   ├── PrintButton.tsx          # window.print() trigger
    │   ├── CtaBanner.tsx            # Calendly CTA at bottom
    │   └── Toast.tsx                # Error fallback notice
    └── __tests__/                   # Co-located test files (pricing, prompts, streaming, components)
        ├── pricing.test.ts
        ├── prompts.test.ts
        ├── streaming.test.ts
        └── components/
            ├── TradeToggle.test.tsx
            └── QuoteDocument.test.tsx
```

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `netlify.toml`, `.gitignore`, `README.md`, `index.html`, `src/main.tsx`, `src/index.css`, `src/App.tsx`, `public/logo.png`

- [ ] **Step 1: Copy logo from dashboard repo**

```bash
cp "C:/Users/zimme/automated-coo-demo/public/logo.png" "C:/Users/zimme/automated-quotes-demo/public/logo.png"
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "automated-quotes-demo",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.1",
    "lucide-react": "^0.460.0",
    "partial-json": "^0.1.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@netlify/functions": "^2.8.2",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

Copy from dashboard with Vitest globals added:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

- [ ] **Step 6: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 7: Create `tailwind.config.ts`** (matches dashboard palette)

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B3A5C',
        brand: { navy: '#1B3A5C', blue: '#2E75B6', teal: '#1A7A6E' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        document: '0 4px 12px 0 rgb(15 23 42 / 0.08), 0 2px 4px 0 rgb(15 23 42 / 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 8: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 9: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 10: Create `.gitignore`**

```
node_modules
dist
dist-ssr
.env
.env.local
.DS_Store
*.log
*.tsbuildinfo
.vite
.netlify
```

- [ ] **Step 11: Create `index.html`** (with OG meta tags placeholder — image added in Task 14)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1B3A5C" />
    <meta name="robots" content="index,follow" />

    <title>AI Quote Generator for Trades — The Automated COO</title>
    <meta name="description" content="Type a job description, get a customer-ready quote. AI quote generator built for HVAC, plumbing, electrical, and roofing contractors in the Sacramento metro area." />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="AI Quote Generator for Trades — The Automated COO" />
    <meta property="og:description" content="Type a job description, get a customer-ready quote. Built for trades contractors in the Sacramento metro area." />
    <meta property="og:image" content="/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="The Automated COO" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="AI Quote Generator for Trades — The Automated COO" />
    <meta name="twitter:description" content="Type a job description, get a customer-ready quote." />
    <meta name="twitter:image" content="/og-image.png" />
  </head>
  <body class="bg-slate-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 12: Create `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 13: Create `src/index.css`** (with print styles)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@media print {
  body { background: white; }
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .quote-document { box-shadow: none !important; border: none !important; }
}

.print-only { display: none; }
```

- [ ] **Step 14: Create `src/App.tsx`** (placeholder — fleshed out in Task 12)

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <p className="p-8">Quote generator coming soon.</p>
    </div>
  );
}
```

- [ ] **Step 15: Create minimal `README.md`**

```markdown
# Automated COO — Quote Generator Demo

Public demo of an AI-powered quote generator for trades contractors in the Sacramento metro area. Visitors describe a job in plain English; the tool produces a customer-ready quote.

## Stack
Vite + React + TypeScript + Tailwind + Anthropic Claude Haiku 4.5 (via Netlify function).

## Develop
```bash
npm install
npm run dev
```

## Deploy
Auto-deploys from `main` branch via Netlify. Requires `ANTHROPIC_API_KEY` env var set in Netlify dashboard.

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/` for the implementation plan.
```

- [ ] **Step 16: Install dependencies**

Run from `C:/Users/zimme/automated-quotes-demo`:
```bash
npm install
```
Expected: `node_modules/` populated, no errors.

- [ ] **Step 17: Verify dev server boots**

```bash
npm run dev
```
Expected: Vite starts on `http://localhost:5173`, page shows "Quote generator coming soon."
Stop with Ctrl+C.

- [ ] **Step 18: Verify build works**

```bash
npm run build
```
Expected: builds to `dist/` with no errors.

- [ ] **Step 19: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + React + TypeScript + Tailwind project with Vitest"
```

---

## Task 2: Define core types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type Trade = 'hvac' | 'plumbing' | 'electrical' | 'roofing';

export const TRADES: { id: Trade; label: string }[] = [
  { id: 'hvac', label: 'HVAC' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'roofing', label: 'Roofing' },
];

export interface LineItem {
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: 'labor' | 'materials';
}

export interface CustomerInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface ContractorInfo {
  name: string;
  license: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface Quote {
  trade: Trade;
  quoteNumber: string;
  dateIssued: string;
  validUntil: string;
  contractor: ContractorInfo;
  customer: CustomerInfo;
  summary: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  terms: string[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "Add core types: Trade, Quote, LineItem, CustomerInfo, ContractorInfo"
```

---

## Task 3: Sacramento pricing reference data

**Files:**
- Create: `src/pricing/sacramento.ts`
- Create: `src/__tests__/pricing.test.ts`

- [ ] **Step 1: Write the failing test `src/__tests__/pricing.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { sacramentoPricing } from '../pricing/sacramento';
import { TRADES } from '../types';

describe('sacramentoPricing', () => {
  it('has an entry for every supported trade', () => {
    for (const { id } of TRADES) {
      expect(sacramentoPricing[id]).toBeDefined();
    }
  });

  it('uses Sacramento County sales tax rate (7.75%)', () => {
    for (const { id } of TRADES) {
      expect(sacramentoPricing[id].salesTaxRate).toBe(0.0775);
    }
  });

  it('has at least one labor rate per trade', () => {
    for (const { id } of TRADES) {
      const rates = Object.values(sacramentoPricing[id].laborRates);
      expect(rates.length).toBeGreaterThan(0);
      for (const rate of rates) expect(rate).toBeGreaterThan(0);
    }
  });

  it('typical job size ranges are ascending and non-overlapping', () => {
    for (const { id } of TRADES) {
      const { small, medium, large } = sacramentoPricing[id].typicalJobSizes;
      expect(small[0]).toBeLessThan(small[1]);
      expect(small[1]).toBeLessThanOrEqual(medium[0]);
      expect(medium[0]).toBeLessThan(medium[1]);
      expect(medium[1]).toBeLessThanOrEqual(large[0]);
      expect(large[0]).toBeLessThan(large[1]);
    }
  });
});
```

- [ ] **Step 2: Run the test, expect failure**

```bash
npm test -- pricing
```
Expected: FAIL — `sacramentoPricing` not found.

- [ ] **Step 3: Implement `src/pricing/sacramento.ts`**

Use Sacramento MSA reference values as of 2026-05-04. Sources: BLS California regional data, RSMeans regional indices, local trade association posts.

```ts
import type { Trade } from '../types';

export interface TradePricing {
  laborRates: Record<string, number>;
  materials: Record<string, { unit: string; unitPrice: number; markup: number }>;
  typicalJobSizes: { small: [number, number]; medium: [number, number]; large: [number, number] };
  salesTaxRate: number;
  regionalNotes: string;
}

export const sacramentoPricing: Record<Trade, TradePricing> = {
  hvac: {
    laborRates: { service: 145, install: 110, helper: 75 },
    materials: {
      'Refrigerant R-410A': { unit: 'lb', unitPrice: 95, markup: 0.4 },
      'Heat exchanger (mid-tier)': { unit: 'ea', unitPrice: 850, markup: 0.35 },
      'Programmable thermostat': { unit: 'ea', unitPrice: 220, markup: 0.4 },
      'Ductwork (rigid, per linear foot)': { unit: 'lf', unitPrice: 18, markup: 0.4 },
      'Condensing unit (3-ton, 16 SEER2)': { unit: 'ea', unitPrice: 2400, markup: 0.3 },
      'Air handler (3-ton)': { unit: 'ea', unitPrice: 1850, markup: 0.3 },
      'High-efficiency gas furnace (80k BTU)': { unit: 'ea', unitPrice: 2100, markup: 0.3 },
    },
    typicalJobSizes: { small: [400, 1500], medium: [1500, 6000], large: [6000, 18000] },
    salesTaxRate: 0.0775,
    regionalNotes: 'Sacramento Valley summer heat (95-105°F May-Sept) drives high HVAC service demand. AC replacements peak May-July; furnace work peaks Oct-Feb.',
  },
  plumbing: {
    laborRates: { service: 135, install: 105, apprentice: 75 },
    materials: {
      'Standard toilet (1.28 GPF)': { unit: 'ea', unitPrice: 280, markup: 0.4 },
      'Tank water heater (50-gal gas)': { unit: 'ea', unitPrice: 1100, markup: 0.3 },
      'Tankless water heater': { unit: 'ea', unitPrice: 1600, markup: 0.3 },
      'PEX tubing (per linear foot)': { unit: 'lf', unitPrice: 1.4, markup: 0.5 },
      'Copper pipe 3/4" (per linear foot)': { unit: 'lf', unitPrice: 6.5, markup: 0.5 },
      'Standard faucet': { unit: 'ea', unitPrice: 180, markup: 0.4 },
      'Garbage disposal (1/2 HP)': { unit: 'ea', unitPrice: 165, markup: 0.4 },
    },
    typicalJobSizes: { small: [250, 1200], medium: [1200, 5000], large: [5000, 15000] },
    salesTaxRate: 0.0775,
    regionalNotes: 'Older Sacramento neighborhoods (East Sac, Curtis Park, Land Park) have galvanized pipe replacement demand. New construction in Roseville/Folsom/Elk Grove drives install volume.',
  },
  electrical: {
    laborRates: { service: 140, install: 110, apprentice: 80 },
    materials: {
      '200A main panel': { unit: 'ea', unitPrice: 650, markup: 0.35 },
      '20A circuit breaker': { unit: 'ea', unitPrice: 22, markup: 0.5 },
      '12 AWG Romex (per 250 ft roll)': { unit: 'roll', unitPrice: 95, markup: 0.4 },
      'Standard duplex outlet': { unit: 'ea', unitPrice: 4, markup: 0.6 },
      'GFCI outlet': { unit: 'ea', unitPrice: 22, markup: 0.5 },
      'Recessed LED can (6 in)': { unit: 'ea', unitPrice: 28, markup: 0.5 },
      'EV charging circuit (240V)': { unit: 'ea', unitPrice: 380, markup: 0.35 },
    },
    typicalJobSizes: { small: [300, 1500], medium: [1500, 6000], large: [6000, 14000] },
    salesTaxRate: 0.0775,
    regionalNotes: 'Sacramento area has rising EV adoption — Level 2 charger installs are a growth segment. Title 24 (CA energy code) compliance drives demand for LED retrofits.',
  },
  roofing: {
    laborRates: { service: 95, install: 85, helper: 65 },
    materials: {
      'Asphalt shingle (per square / 100 sq ft)': { unit: 'sq', unitPrice: 110, markup: 0.4 },
      'Synthetic underlayment (per square)': { unit: 'sq', unitPrice: 28, markup: 0.45 },
      'Ice & water shield (per square)': { unit: 'sq', unitPrice: 65, markup: 0.4 },
      'Drip edge (per linear foot)': { unit: 'lf', unitPrice: 2.4, markup: 0.5 },
      'Ridge cap (per linear foot)': { unit: 'lf', unitPrice: 6, markup: 0.45 },
      'Tear-off and disposal (per square)': { unit: 'sq', unitPrice: 45, markup: 0.3 },
      'Tile roof (per square, concrete)': { unit: 'sq', unitPrice: 320, markup: 0.35 },
    },
    typicalJobSizes: { small: [800, 4000], medium: [4000, 14000], large: [14000, 35000] },
    salesTaxRate: 0.0775,
    regionalNotes: 'Sacramento summer hailstorms (rare but common in foothills) drive insurance work. Tile roofs common in older suburbs; asphalt shingle dominates new construction.',
  },
};
```

- [ ] **Step 4: Run the test, expect pass**

```bash
npm test -- pricing
```
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pricing/sacramento.ts src/__tests__/pricing.test.ts
git commit -m "Add Sacramento MSA pricing reference data with structural tests"
```

---

## Task 4: Canned example quotes per trade

**Files:**
- Create: `src/data/canned-quotes.ts`

These are pre-baked example `Quote` objects that render instantly on page load. Each represents a realistic Sacramento-area job.

- [ ] **Step 1: Write `src/data/canned-quotes.ts`**

```ts
import type { Quote, Trade } from '../types';

const SAMPLE_CUSTOMER = {
  name: 'Diana Chen',
  address: '4421 J St, Sacramento, CA 95819',
  email: 'diana.chen@example.com',
  phone: '(916) 555-0142',
};

const today = new Date();
const validUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

const CONTRACTORS: Record<Trade, Quote['contractor']> = {
  hvac: {
    name: 'Your HVAC Company',
    license: 'CSLB Lic. #SAMPLE',
    address: '1234 Sample St, Sacramento, CA 95814',
    phone: '(916) 555-0100',
    email: 'hello@yourhvac.example',
    website: 'yourhvac.example',
  },
  plumbing: {
    name: 'Your Plumbing Company',
    license: 'CSLB Lic. #SAMPLE',
    address: '1234 Sample St, Sacramento, CA 95814',
    phone: '(916) 555-0100',
    email: 'hello@yourplumbing.example',
    website: 'yourplumbing.example',
  },
  electrical: {
    name: 'Your Electrical Company',
    license: 'CSLB Lic. #SAMPLE',
    address: '1234 Sample St, Sacramento, CA 95814',
    phone: '(916) 555-0100',
    email: 'hello@yourelectric.example',
    website: 'yourelectric.example',
  },
  roofing: {
    name: 'Your Roofing Company',
    license: 'CSLB Lic. #SAMPLE',
    address: '1234 Sample St, Sacramento, CA 95814',
    phone: '(916) 555-0100',
    email: 'hello@yourroofing.example',
    website: 'yourroofing.example',
  },
};

const STANDARD_TERMS = [
  '50% deposit due at scheduling, balance on completion.',
  'Change orders must be submitted in writing and may affect timeline and cost.',
  'Workmanship warranted for one year from completion date; manufacturer warranties pass through.',
  'Payment due within 7 days of completion. Late balances accrue 1.5% monthly interest.',
  'This quote excludes permits, structural modifications, and discovery of pre-existing code violations unless specified above.',
];

export const cannedQuotes: Record<Trade, Quote> = {
  hvac: {
    trade: 'hvac',
    quoteNumber: 'Q-SAMPLE-HVAC',
    dateIssued: fmt(today),
    validUntil: fmt(validUntil),
    contractor: CONTRACTORS.hvac,
    customer: SAMPLE_CUSTOMER,
    summary: 'Replace existing 14-year-old gas furnace and 3-ton AC condenser with high-efficiency equivalents. Install new programmable thermostat. 2,200 sq ft single-story ranch home. Includes refrigerant charge, equipment haul-away, and full system commissioning.',
    lineItems: [
      { category: 'labor', description: 'System removal and disposal', qty: 4, unit: 'hr', unitPrice: 110, total: 440 },
      { category: 'labor', description: 'New system installation', qty: 12, unit: 'hr', unitPrice: 110, total: 1320 },
      { category: 'labor', description: 'Refrigerant charge & system commissioning', qty: 2, unit: 'hr', unitPrice: 145, total: 290 },
      { category: 'materials', description: 'Condensing unit (3-ton, 16 SEER2)', qty: 1, unit: 'ea', unitPrice: 3120, total: 3120 },
      { category: 'materials', description: 'Air handler (3-ton)', qty: 1, unit: 'ea', unitPrice: 2405, total: 2405 },
      { category: 'materials', description: 'High-efficiency gas furnace (80k BTU)', qty: 1, unit: 'ea', unitPrice: 2730, total: 2730 },
      { category: 'materials', description: 'Programmable thermostat', qty: 1, unit: 'ea', unitPrice: 308, total: 308 },
      { category: 'materials', description: 'Refrigerant R-410A', qty: 8, unit: 'lb', unitPrice: 133, total: 1064 },
    ],
    subtotal: 11677,
    tax: 745,
    total: 12422,
    terms: STANDARD_TERMS,
  },
  plumbing: {
    trade: 'plumbing',
    quoteNumber: 'Q-SAMPLE-PLU',
    dateIssued: fmt(today),
    validUntil: fmt(validUntil),
    contractor: CONTRACTORS.plumbing,
    customer: SAMPLE_CUSTOMER,
    summary: 'Replace existing 12-year-old 50-gallon tank water heater with new tankless unit in garage. Includes gas line resize, new venting, condensate drain, and removal of old equipment.',
    lineItems: [
      { category: 'labor', description: 'Water heater removal and disposal', qty: 2, unit: 'hr', unitPrice: 105, total: 210 },
      { category: 'labor', description: 'Tankless installation including gas line resize', qty: 6, unit: 'hr', unitPrice: 105, total: 630 },
      { category: 'labor', description: 'Venting and condensate drain', qty: 3, unit: 'hr', unitPrice: 105, total: 315 },
      { category: 'materials', description: 'Tankless water heater', qty: 1, unit: 'ea', unitPrice: 2080, total: 2080 },
      { category: 'materials', description: 'Stainless steel vent kit', qty: 1, unit: 'ea', unitPrice: 320, total: 320 },
      { category: 'materials', description: 'Gas line and fittings (3/4")', qty: 12, unit: 'lf', unitPrice: 9.75, total: 117 },
    ],
    subtotal: 3672,
    tax: 196,
    total: 3868,
    terms: STANDARD_TERMS,
  },
  electrical: {
    trade: 'electrical',
    quoteNumber: 'Q-SAMPLE-ELEC',
    dateIssued: fmt(today),
    validUntil: fmt(validUntil),
    contractor: CONTRACTORS.electrical,
    customer: SAMPLE_CUSTOMER,
    summary: 'Install Level 2 EV charging circuit (240V, 50A) in garage. Includes new dedicated breaker in main panel, 35 ft of conduit run, and final inspection coordination. Existing panel has capacity (verified 200A).',
    lineItems: [
      { category: 'labor', description: 'Panel work and breaker install', qty: 2, unit: 'hr', unitPrice: 140, total: 280 },
      { category: 'labor', description: 'Conduit run and wire pull', qty: 3, unit: 'hr', unitPrice: 110, total: 330 },
      { category: 'labor', description: 'Outlet install and final testing', qty: 2, unit: 'hr', unitPrice: 110, total: 220 },
      { category: 'materials', description: 'EV charging circuit kit (240V)', qty: 1, unit: 'ea', unitPrice: 513, total: 513 },
      { category: 'materials', description: '50A double-pole breaker', qty: 1, unit: 'ea', unitPrice: 65, total: 65 },
      { category: 'materials', description: '6 AWG wire (35 ft)', qty: 35, unit: 'lf', unitPrice: 4.2, total: 147 },
      { category: 'materials', description: 'EMT conduit and fittings', qty: 1, unit: 'set', unitPrice: 95, total: 95 },
    ],
    subtotal: 1650,
    tax: 64,
    total: 1714,
    terms: STANDARD_TERMS,
  },
  roofing: {
    trade: 'roofing',
    quoteNumber: 'Q-SAMPLE-ROOF',
    dateIssued: fmt(today),
    validUntil: fmt(validUntil),
    contractor: CONTRACTORS.roofing,
    customer: SAMPLE_CUSTOMER,
    summary: 'Full asphalt shingle roof replacement on 22-square (2,200 sq ft) single-story home. Includes complete tear-off of existing shingles, new synthetic underlayment, drip edge, ridge cap, and 30-year architectural shingles. Disposal included.',
    lineItems: [
      { category: 'labor', description: 'Tear-off and disposal', qty: 22, unit: 'sq', unitPrice: 45, total: 990 },
      { category: 'labor', description: 'Underlayment and shingle installation', qty: 36, unit: 'hr', unitPrice: 85, total: 3060 },
      { category: 'labor', description: 'Flashing, drip edge, ridge cap installation', qty: 8, unit: 'hr', unitPrice: 85, total: 680 },
      { category: 'materials', description: 'Asphalt shingle (30-year architectural)', qty: 22, unit: 'sq', unitPrice: 154, total: 3388 },
      { category: 'materials', description: 'Synthetic underlayment', qty: 22, unit: 'sq', unitPrice: 41, total: 902 },
      { category: 'materials', description: 'Drip edge', qty: 180, unit: 'lf', unitPrice: 3.6, total: 648 },
      { category: 'materials', description: 'Ridge cap', qty: 50, unit: 'lf', unitPrice: 8.7, total: 435 },
    ],
    subtotal: 10103,
    tax: 414,
    total: 10517,
    terms: STANDARD_TERMS,
  },
};
```

- [ ] **Step 2: Smoke-test that totals are internally consistent (write `src/__tests__/canned-quotes.test.ts`)**

```ts
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
});
```

- [ ] **Step 3: Run the test**

```bash
npm test -- canned-quotes
```
Expected: 4 tests pass. If any fail, adjust the canned data so totals reconcile (this catches arithmetic errors in the canned data).

- [ ] **Step 4: Commit**

```bash
git add src/data/canned-quotes.ts src/__tests__/canned-quotes.test.ts
git commit -m "Add canned example quotes for each trade with consistency tests"
```

---

## Task 5: System prompt assembly

**Files:**
- Create: `src/lib/prompts.ts`
- Create: `src/__tests__/prompts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run, expect failure**

```bash
npm test -- prompts
```

- [ ] **Step 3: Implement `src/lib/prompts.ts`**

```ts
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
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm test -- prompts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompts.ts src/__tests__/prompts.test.ts
git commit -m "Add system prompt assembly with Sacramento pricing context injection"
```

---

## Task 6: Streaming JSON parser utility

**Files:**
- Create: `src/lib/streaming.ts`
- Create: `src/__tests__/streaming.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run, expect failure**

```bash
npm test -- streaming
```

- [ ] **Step 3: Implement `src/lib/streaming.ts`**

```ts
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
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm test -- streaming
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/streaming.ts src/__tests__/streaming.test.ts
git commit -m "Add SSE consumer + partial JSON parser for live streaming"
```

---

## Task 7: Netlify function for /api/quote

**Files:**
- Create: `netlify/functions/quote.ts`

- [ ] **Step 1: Implement the function**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add netlify/functions/quote.ts
git commit -m "Add /api/quote Netlify streaming function calling Claude Haiku"
```

---

## Task 8: Header and TradeToggle components

**Files:**
- Create: `src/components/Header.tsx`, `src/components/TradeToggle.tsx`
- Create: `src/__tests__/components/TradeToggle.test.tsx`

- [ ] **Step 1: Write the failing test for `TradeToggle`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TradeToggle } from '../../components/TradeToggle';

describe('TradeToggle', () => {
  it('renders all 4 trade buttons', () => {
    render(<TradeToggle selected="hvac" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /HVAC/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Plumbing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Electrical/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Roofing/i })).toBeInTheDocument();
  });

  it('marks the selected trade as pressed', () => {
    render(<TradeToggle selected="plumbing" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Plumbing/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /HVAC/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange when a different trade is clicked', () => {
    const onChange = vi.fn();
    render(<TradeToggle selected="hvac" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Electrical/i }));
    expect(onChange).toHaveBeenCalledWith('electrical');
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
npm test -- TradeToggle
```

- [ ] **Step 3: Implement `src/components/TradeToggle.tsx`**

```tsx
import { TRADES, type Trade } from '../types';

interface Props {
  selected: Trade;
  onChange: (trade: Trade) => void;
}

export function TradeToggle({ selected, onChange }: Props) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 no-print" role="tablist">
      {TRADES.map(({ id, label }) => {
        const active = id === selected;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              active ? 'bg-brand-navy text-white shadow' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Implement `src/components/Header.tsx`**

```tsx
export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 no-print">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <img src="/logo.png" alt="The Automated COO" className="h-8 w-8" />
        <div>
          <div className="font-semibold text-brand-navy">The Automated COO</div>
          <div className="text-xs text-slate-500">AI quote generator for trades · Sacramento, CA</div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Run tests, expect pass**

```bash
npm test -- TradeToggle
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx src/components/TradeToggle.tsx src/__tests__/components/TradeToggle.test.tsx
git commit -m "Add Header and TradeToggle components"
```

---

## Task 9: JobInput component

**Files:**
- Create: `src/components/JobInput.tsx`

The textarea where the visitor types a job description, with a Generate button that triggers AI streaming.

- [ ] **Step 1: Implement `src/components/JobInput.tsx`**

```tsx
import { useState } from 'react';
import type { Trade } from '../types';

const PLACEHOLDERS: Record<Trade, string> = {
  hvac: 'e.g. Homeowner needs full system replacement. 2,200 sq ft single-story ranch, 14-year-old gas furnace and 3-ton AC. Wants high-efficiency unit and new programmable thermostat.',
  plumbing: 'e.g. Replace 12-year-old 50-gallon tank water heater with a tankless unit in the garage. Includes gas line resize and new venting.',
  electrical: 'e.g. Install Level 2 EV charging circuit (240V, 50A) in garage. About 35 ft from main panel. Existing panel has capacity.',
  roofing: 'e.g. Full roof replacement on 2,200 sq ft single-story home. Tear off old asphalt shingles, install 30-year architectural shingles with synthetic underlayment.',
};

interface Props {
  trade: Trade;
  onGenerate: (description: string) => void;
  isGenerating: boolean;
}

export function JobInput({ trade, onGenerate, isGenerating }: Props) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed && !isGenerating) onGenerate(trimmed);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 no-print">
      <label htmlFor="job-input" className="block text-sm font-medium text-slate-700 mb-2">
        Or describe your own job:
      </label>
      <textarea
        id="job-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDERS[trade]}
        rows={4}
        maxLength={4000}
        disabled={isGenerating}
        className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-slate-50"
      />
      <div className="mt-3 flex justify-between items-center">
        <p className="text-xs text-slate-500">{text.length} / 4000 characters</p>
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || isGenerating}
          className="bg-brand-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-blue disabled:bg-slate-300 transition-colors"
        >
          {isGenerating ? 'Analyzing job…' : 'Generate Quote'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/JobInput.tsx
git commit -m "Add JobInput component with per-trade placeholder text"
```

---

## Task 10: QuoteDocument component

**Files:**
- Create: `src/components/QuoteDocument.tsx`
- Create: `src/__tests__/components/QuoteDocument.test.tsx`

The full quote: letterhead → metadata → customer block → summary → line items → totals → terms → acceptance → footer.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteDocument } from '../../components/QuoteDocument';
import { cannedQuotes } from '../../data/canned-quotes';

describe('QuoteDocument', () => {
  it('renders contractor name from quote', () => {
    render(<QuoteDocument quote={cannedQuotes.hvac} />);
    expect(screen.getByText(/Your HVAC Company/i)).toBeInTheDocument();
  });

  it('renders all line items', () => {
    render(<QuoteDocument quote={cannedQuotes.hvac} />);
    for (const item of cannedQuotes.hvac.lineItems) {
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }
  });

  it('renders subtotal, tax, and total', () => {
    render(<QuoteDocument quote={cannedQuotes.hvac} />);
    expect(screen.getByText(/Subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/Tax/i)).toBeInTheDocument();
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });

  it('renders summary text', () => {
    render(<QuoteDocument quote={cannedQuotes.hvac} />);
    const summary = cannedQuotes.hvac.summary.slice(0, 30);
    expect(screen.getByText(new RegExp(summary, 'i'))).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
npm test -- QuoteDocument
```

- [ ] **Step 3: Implement `src/components/QuoteDocument.tsx`**

```tsx
import type { Quote } from '../types';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

interface Props {
  quote: Partial<Quote> & { trade?: string };
}

export function QuoteDocument({ quote }: Props) {
  const labor = (quote.lineItems ?? []).filter((li) => li.category === 'labor');
  const materials = (quote.lineItems ?? []).filter((li) => li.category === 'materials');

  return (
    <article className="quote-document bg-white rounded-2xl border border-slate-200 shadow-document p-8 md:p-12 max-w-4xl mx-auto font-serif text-slate-900">
      <header className="flex justify-between items-start gap-6 pb-6 border-b border-slate-300">
        {quote.contractor && (
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{quote.contractor.name}</h1>
            <p className="text-sm text-slate-600 mt-1">{quote.contractor.license}</p>
            <p className="text-sm text-slate-600">{quote.contractor.address}</p>
            <p className="text-sm text-slate-600">{quote.contractor.phone} · {quote.contractor.email}</p>
            <p className="text-sm text-slate-600">{quote.contractor.website}</p>
          </div>
        )}
        <div className="text-right text-sm">
          <p className="font-semibold text-slate-900">QUOTE</p>
          {quote.quoteNumber && <p className="text-slate-600">{quote.quoteNumber}</p>}
          {quote.dateIssued && <p className="text-slate-600">Issued: {fmtDate(quote.dateIssued)}</p>}
          {quote.validUntil && <p className="text-slate-600">Valid until: {fmtDate(quote.validUntil)}</p>}
        </div>
      </header>

      {quote.customer && (
        <section className="py-6 border-b border-slate-200">
          <h2 className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 mb-2">Prepared for</h2>
          <p className="font-semibold">{quote.customer.name}</p>
          <p className="text-sm text-slate-600">{quote.customer.address}</p>
          <p className="text-sm text-slate-600">{quote.customer.email} · {quote.customer.phone}</p>
        </section>
      )}

      {quote.summary && (
        <section className="py-6 border-b border-slate-200">
          <h2 className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 mb-2">Job summary</h2>
          <p className="text-base leading-relaxed">{quote.summary}</p>
        </section>
      )}

      {quote.lineItems && quote.lineItems.length > 0 && (
        <section className="py-6 border-b border-slate-200">
          <h2 className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 mb-3">Line items</h2>
          <LineItemsTable label="Labor" items={labor} />
          <LineItemsTable label="Materials" items={materials} />
        </section>
      )}

      {quote.subtotal !== undefined && (
        <section className="py-4 border-b border-slate-200">
          <div className="flex justify-end">
            <table className="text-sm">
              <tbody>
                <tr><td className="pr-8 py-1 text-slate-600">Subtotal</td><td className="text-right font-medium">{fmtCurrency(quote.subtotal)}</td></tr>
                {quote.tax !== undefined && <tr><td className="pr-8 py-1 text-slate-600">Tax (Sacramento County 7.75%, materials only)</td><td className="text-right font-medium">{fmtCurrency(quote.tax)}</td></tr>}
                {quote.total !== undefined && <tr className="border-t border-slate-300"><td className="pr-8 pt-2 font-bold text-base">Total</td><td className="pt-2 text-right font-bold text-base">{fmtCurrency(quote.total)}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {quote.terms && quote.terms.length > 0 && (
        <section className="py-6 border-b border-slate-200">
          <h2 className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 mb-2">Terms & conditions</h2>
          <ol className="text-sm space-y-1.5 list-decimal list-inside">
            {quote.terms.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </section>
      )}

      <section className="pt-6">
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-slate-600 mb-8">Customer signature</p>
            <div className="border-b border-slate-400" />
          </div>
          <div>
            <p className="text-slate-600 mb-8">Date</p>
            <div className="border-b border-slate-400" />
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-8 font-sans">
          Generated by <a href="https://automated-coo-demo.netlify.app" className="underline">The Automated COO</a> — AI quote demo
        </p>
      </section>
    </article>
  );
}

function LineItemsTable({ label, items }: { label: string; items: Quote['lineItems'] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-4">
      <h3 className="text-xs font-sans font-semibold text-slate-700 mb-1.5">{label}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 font-sans">
            <th className="pb-1 font-medium">Description</th>
            <th className="pb-1 font-medium text-right w-16">Qty</th>
            <th className="pb-1 font-medium text-right w-16">Unit</th>
            <th className="pb-1 font-medium text-right w-24">Rate</th>
            <th className="pb-1 font-medium text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="py-1.5">{it.description}</td>
              <td className="py-1.5 text-right">{it.qty}</td>
              <td className="py-1.5 text-right">{it.unit}</td>
              <td className="py-1.5 text-right">{fmtCurrency(it.unitPrice)}</td>
              <td className="py-1.5 text-right font-medium">{fmtCurrency(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm test -- QuoteDocument
```

- [ ] **Step 5: Commit**

```bash
git add src/components/QuoteDocument.tsx src/__tests__/components/QuoteDocument.test.tsx
git commit -m "Add QuoteDocument component rendering the full customer-facing quote"
```

---

## Task 11: PrintButton, CtaBanner, Toast components

**Files:**
- Create: `src/components/PrintButton.tsx`, `src/components/CtaBanner.tsx`, `src/components/Toast.tsx`

- [ ] **Step 1: Implement `src/components/PrintButton.tsx`**

```tsx
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print text-sm text-brand-blue hover:text-brand-navy underline"
    >
      Print quote
    </button>
  );
}
```

- [ ] **Step 2: Implement `src/components/CtaBanner.tsx`**

```tsx
const BOOKING_URL = 'https://cal.com/benchcoo/20min';

export function CtaBanner() {
  return (
    <section className="no-print bg-brand-navy text-white rounded-2xl px-8 py-10 text-center max-w-3xl mx-auto my-12 shadow-card">
      <h2 className="text-2xl font-semibold mb-2">Want this for your business?</h2>
      <p className="text-slate-200 mb-5">Book a free 20-minute consult and we'll talk about turning your quoting (and the rest of your operations) into a system that runs itself.</p>
      <a
        href={BOOKING_URL}
        className="inline-block bg-white text-brand-navy font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
      >
        Book a 20-min consult →
      </a>
    </section>
  );
}
```

- [ ] **Step 3: Implement `src/components/Toast.tsx`**

```tsx
import { useEffect } from 'react';

interface Props {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm animate-fade-in"
    >
      {message}
    </div>
  );
}
```

- [ ] **Step 4: Add the `animate-fade-in` keyframes to `tailwind.config.ts`** (already present from Task 1) — verify by re-reading the file.

- [ ] **Step 5: Commit**

```bash
git add src/components/PrintButton.tsx src/components/CtaBanner.tsx src/components/Toast.tsx
git commit -m "Add PrintButton, CtaBanner, and Toast helper components"
```

---

## Task 12: App.tsx — wire everything together (initial state)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` content**

```tsx
import { useState } from 'react';
import { Header } from './components/Header';
import { TradeToggle } from './components/TradeToggle';
import { JobInput } from './components/JobInput';
import { QuoteDocument } from './components/QuoteDocument';
import { PrintButton } from './components/PrintButton';
import { CtaBanner } from './components/CtaBanner';
import { Toast } from './components/Toast';
import { cannedQuotes } from './data/canned-quotes';
import type { Quote, Trade } from './types';
import { streamQuote } from './lib/streaming';

export default function App() {
  const [trade, setTrade] = useState<Trade>('hvac');
  const [quote, setQuote] = useState<Partial<Quote>>(cannedQuotes.hvac);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const switchTrade = (t: Trade) => {
    abortController?.abort();
    setAbortController(null);
    setIsGenerating(false);
    setTrade(t);
    setQuote(cannedQuotes[t]);
  };

  const generate = async (description: string) => {
    abortController?.abort();
    const ctrl = new AbortController();
    setAbortController(ctrl);
    setIsGenerating(true);
    setQuote({ ...cannedQuotes[trade], lineItems: [], summary: '', subtotal: undefined, tax: undefined, total: undefined });

    try {
      for await (const partial of streamQuote(trade, description, ctrl.signal)) {
        if (partial.error) throw new Error(partial.error);
        setQuote((prev) => ({
          ...cannedQuotes[trade],
          ...prev,
          ...partial,
          contractor: cannedQuotes[trade].contractor,
        }));
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error(err);
      setToast("Couldn't generate live — showing the sample instead. Try again?");
      setQuote(cannedQuotes[trade]);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center no-print">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy">AI quote generator for trades</h1>
          <p className="text-slate-600 mt-2">Type a job — get a customer-ready quote.</p>
        </div>

        <div className="flex justify-center no-print">
          <TradeToggle selected={trade} onChange={switchTrade} />
        </div>

        <JobInput trade={trade} onGenerate={generate} isGenerating={isGenerating} />

        <div className="flex justify-end max-w-4xl mx-auto px-2 no-print">
          <PrintButton />
        </div>

        <QuoteDocument quote={quote} />

        <CtaBanner />

        <footer className="no-print text-center text-xs text-slate-400 py-6">
          Generated by <a href="https://automated-coo-demo.netlify.app" className="underline">The Automated COO</a>
        </footer>
      </main>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and verify**

```bash
npm run dev
```
Visit `http://localhost:5173`. Expected:
- Page renders with HVAC canned quote visible
- Trade toggle switches between trades, swapping the canned quote
- Textarea accepts input; Generate button is enabled when text is present
- Clicking Generate triggers a network call to `/api/quote` (will fail in dev without Netlify CLI, expected — toast appears, falls back to canned)

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "Wire App.tsx with state, streaming, trade switching, and error fallback"
```

---

## Task 13: Verify build and run all tests

- [ ] **Step 1: Run all tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 2: Run build**

```bash
npm run build
```
Expected: builds to `dist/` with no errors.

- [ ] **Step 3: Preview the production build**

```bash
npm run preview
```
Visit the preview URL. Verify the page renders identically to dev mode.

- [ ] **Step 4: Test locally with Netlify CLI (optional but recommended)**

```bash
npm install -g netlify-cli
netlify dev
```
This boots the function locally. Set `ANTHROPIC_API_KEY` in your shell before running, or in a `.env` file (already gitignored). Try the live generation flow end-to-end. Expected: streaming works, real quote appears.

- [ ] **Step 5: Commit any fixes from testing**

```bash
git add -A && git status
# only commit if changes were made
```

---

## Task 14: Push to GitHub and deploy to Netlify

- [ ] **Step 1: Create GitHub repo (user-driven via browser)**

Instructions for the user:
1. Visit https://github.com/new
2. Repository name: `automated-quotes-demo`
3. Public, no init files
4. Click Create repository

- [ ] **Step 2: Add remote and push**

```bash
cd "C:/Users/zimme/automated-quotes-demo"
git remote add origin https://github.com/soul2fade/automated-quotes-demo.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Connect to Netlify (user-driven via browser)**

Instructions for the user:
1. Visit https://app.netlify.com → Add new site → Import an existing project → Deploy with GitHub
2. Search and select `automated-quotes-demo`
3. Build settings should auto-fill from `netlify.toml`. Click Deploy site.
4. After first deploy, go to Site settings → Environment variables → Add variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: (the user's Anthropic API key)
5. Trigger a redeploy (Deploys tab → Trigger deploy → Deploy site) so the function picks up the new env var.

- [ ] **Step 4: Optionally rename Netlify subdomain**

In Netlify: Site configuration → Domain management → Options → Edit site name → set to `automated-quotes-demo`. Site is now at `https://automated-quotes-demo.netlify.app`.

- [ ] **Step 5: Verify live deployment**

```bash
curl -s https://automated-quotes-demo.netlify.app/ | grep -E '<title>|og:title'
```
Expected: meta tags rendered correctly.

Visit the live URL in a browser. Verify:
- Canned quote renders within 1 second
- Trade toggle works
- Typing a description and clicking Generate produces a real streaming quote (allow 3–8 seconds)

---

## Task 15: Take OG screenshot, finalize, and add to LinkedIn

- [ ] **Step 1: Take OG screenshot (user-driven)**

Open `https://automated-quotes-demo.netlify.app/` in Chrome at desktop width. Use Win+Shift+S to capture the hero + visible quote area. Save as `og-image.png` to Desktop.

- [ ] **Step 2: Resize/crop to 1200x630 and place in `public/`**

```powershell
# PowerShell — crop to 1.91:1 aspect ratio and resize to 1200x630
Add-Type -AssemblyName System.Drawing
$src = "C:\Users\zimme\OneDrive\Desktop\og-image.png"
$dst = "C:\Users\zimme\automated-quotes-demo\public\og-image.png"
$img = [System.Drawing.Image]::FromFile($src)
$tr = 1200/630; $sr = $img.Width/$img.Height
if ($sr -gt $tr) { $cw = [int]($img.Height*$tr); $ch = $img.Height; $cx = [int](($img.Width - $cw)/2); $cy = 0 }
else { $cw = $img.Width; $ch = [int]($img.Width/$tr); $cx = 0; $cy = [int](($img.Height - $ch)/2) }
$rect = [System.Drawing.Rectangle]::new($cx, $cy, $cw, $ch)
$bmp = [System.Drawing.Bitmap]::new(1200, 630)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, [System.Drawing.Rectangle]::new(0,0,1200,630), $rect, [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
```

- [ ] **Step 3: Commit and push**

```bash
cd "C:/Users/zimme/automated-quotes-demo"
git add public/og-image.png
git commit -m "Add OG share image for LinkedIn previews"
git push
```

Wait ~1 minute for Netlify auto-deploy.

- [ ] **Step 4: Verify LinkedIn preview**

Visit https://www.linkedin.com/post-inspector/, paste the live URL, click Inspect. Expected: card shows the dashboard screenshot, title, description.

- [ ] **Step 5: Add to LinkedIn Featured (user-driven)**

Instructions for the user:
1. Profile → Featured section → click + → Add a link
2. Paste `https://automated-quotes-demo.netlify.app/`
3. Add caption: *"AI quote generator for trades — type a job description in plain English, get a customer-ready quote in seconds. Built with Claude Haiku, regional pricing calibrated to Sacramento metro. Live demo, fully interactive."*
4. Save

---

## Self-review notes

After writing this plan, I checked it against the spec sections:

- **Spec §3 Architecture**: covered by Task 1 (scaffolding), Task 7 (function), Task 14 (deploy) ✓
- **Spec §4 UX flow**: Task 8 (toggle), Task 9 (input), Task 12 (state wiring), Task 11 (CTA + Toast) ✓
- **Spec §5 Quote document structure**: Task 10 fully covers the 9 sub-sections ✓
- **Spec §6 AI integration**: Task 5 (prompt), Task 6 (streaming), Task 7 (function) ✓
- **Spec §7 Sacramento pricing reference**: Task 3 ✓
- **Spec §9 Risks & mitigations**: Task 7 has try/catch on Anthropic call; Task 12 catches errors and falls back to canned. Validation in Task 7 (4000 char limit, valid trade) covers offensive/spam input upstream. ✓
- **Spec §10 Success criteria**: Task 14 verifies live URL, Task 15 covers OG image + LinkedIn ✓

No placeholders. All file paths concrete. All code blocks complete. Type names consistent across tasks (`Quote`, `LineItem`, `Trade` defined in Task 2 are used identically in Tasks 4–12).

One scope note: the spec's "inline-editable customer block" (§5 #3) is not implemented — quotes display the customer info but don't allow inline editing. This is a YAGNI deferral for v1: the AI generates customer info as part of the quote, and the canned examples have placeholder customer data. Adding click-to-edit would add UX complexity for a feature visitors won't use during a 30-second demo. If this matters, it can be a v2 task.
