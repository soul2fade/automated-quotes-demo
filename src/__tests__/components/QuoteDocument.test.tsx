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
    expect(screen.getAllByText(/^Total$/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders summary text', () => {
    render(<QuoteDocument quote={cannedQuotes.hvac} />);
    const summary = cannedQuotes.hvac.summary.slice(0, 30);
    expect(screen.getByText(new RegExp(summary, 'i'))).toBeInTheDocument();
  });
});
