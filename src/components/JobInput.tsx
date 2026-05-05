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
