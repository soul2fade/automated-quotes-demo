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
    tax: 746,
    total: 12423,
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
    tax: 195,
    total: 3867,
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
    tax: 416,
    total: 10519,
    terms: STANDARD_TERMS,
  },
};
