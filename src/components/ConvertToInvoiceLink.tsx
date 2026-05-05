import type { Quote } from '../types';

const INVOICE_TOOL_URL = 'https://invoicedemo.netlify.app/';

function encodeQuote(quote: Partial<Quote>): string {
  const json = JSON.stringify(quote);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

interface Props {
  quote: Partial<Quote>;
  disabled?: boolean;
}

export function ConvertToInvoiceLink({ quote, disabled }: Props) {
  const handleClick = () => {
    if (disabled) return;
    const encoded = encodeQuote(quote);
    window.open(`${INVOICE_TOOL_URL}#q=${encoded}`, '_blank', 'noopener');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`no-print text-sm underline transition-colors ${
        disabled
          ? 'text-slate-300 cursor-not-allowed'
          : 'text-brand-blue hover:text-brand-navy'
      }`}
    >
      Convert to invoice →
    </button>
  );
}
