import type { Quote } from '../types';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

interface Props {
  quote: Partial<Quote>;
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
                <tr>
                  <td className="pr-8 py-1 text-slate-600">Subtotal</td>
                  <td className="text-right font-medium">{fmtCurrency(quote.subtotal)}</td>
                </tr>
                {quote.tax !== undefined && (
                  <tr>
                    <td className="pr-8 py-1 text-slate-600">Tax (Sacramento County 7.75%, materials only)</td>
                    <td className="text-right font-medium">{fmtCurrency(quote.tax)}</td>
                  </tr>
                )}
                {quote.total !== undefined && (
                  <tr className="border-t border-slate-300">
                    <td className="pr-8 pt-2 font-bold text-base">Total</td>
                    <td className="pt-2 text-right font-bold text-base">{fmtCurrency(quote.total)}</td>
                  </tr>
                )}
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
