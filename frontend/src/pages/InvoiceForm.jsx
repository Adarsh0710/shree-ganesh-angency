import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client.js';
import { downloadInvoicePdf } from '../utils/downloadPdf.js';

function calc(items, taxMode, cgstR, sgstR, igstR) {
  const taxable = items.reduce((s, l) => s + Number(l.rate || 0) * Number(l.quantity || 0), 0);
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (taxMode === 'inter') {
    igst = (taxable * igstR) / 100;
  } else {
    cgst = (taxable * cgstR) / 100;
    sgst = (taxable * sgstR) / 100;
  }
  const total = taxable + cgst + sgst + igst;
  return { taxable, cgst, sgst, igst, total };
}

export default function InvoiceForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id || id === 'new';
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [placeOfSupply, setPlaceOfSupply] = useState('27-MAHARASHTRA');
  const [taxMode, setTaxMode] = useState('intra');
  const [cgstRate, setCgstRate] = useState(9);
  const [sgstRate, setSgstRate] = useState(9);
  const [igstRate, setIgstRate] = useState(18);
  const [sacCode, setSacCode] = useState('9954');
  const [notes, setNotes] = useState('Thank you for the Business!');
  const [amountPaid, setAmountPaid] = useState(0);
  const [items, setItems] = useState([{ name: '', rate: '', quantity: '1' }]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [invNum, setInvNum] = useState('');

  useEffect(() => {
    api.get('/clients').then((r) => setClients(r.data.data));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api
      .get(`/invoices/${id}`)
      .then((r) => {
        const i = r.data.data;
        setInvNum(i.invoiceNumber);
        setClientId(i.client?._id || i.client);
        setInvoiceDate(i.invoiceDate ? new Date(i.invoiceDate).toISOString().slice(0, 10) : '');
        setDueDate(i.dueDate ? new Date(i.dueDate).toISOString().slice(0, 10) : '');
        setPlaceOfSupply(i.placeOfSupply || '27-MAHARASHTRA');
        setTaxMode(i.taxMode || 'intra');
        setCgstRate(i.cgstRate ?? 9);
        setSgstRate(i.sgstRate ?? 9);
        setIgstRate(i.igstRate ?? 18);
        setSacCode(i.sacCode || '9954');
        setNotes(i.notes || '');
        setAmountPaid(i.amountPaid ?? 0);
        setItems(
          (i.items || []).map((x) => ({
            name: x.name,
            rate: String(x.rate),
            quantity: String(x.quantity),
          }))
        );
        if (i.client?.email) setEmailTo(i.client.email);
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const preview = useMemo(
    () => calc(items, taxMode, cgstRate, sgstRate, igstRate),
    [items, taxMode, cgstRate, sgstRate, igstRate]
  );

  const setLine = (ix, k, v) => {
    const n = [...items];
    n[ix] = { ...n[ix], [k]: v };
    setItems(n);
  };
  const addLine = () => setItems([...items, { name: '', rate: '', quantity: '1' }]);
  const remLine = (ix) => setItems(items.length > 1 ? items.filter((_, i) => i !== ix) : items);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        clientId,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        placeOfSupply,
        taxMode,
        cgstRate,
        sgstRate,
        igstRate,
        sacCode,
        notes,
        amountPaid: Number(amountPaid),
        items: items.map((l) => ({
          name: l.name,
          rate: Number(l.rate),
          quantity: Number(l.quantity),
        })),
      };
      if (isNew) {
        await api.post('/invoices', payload);
      } else {
        await api.put(`/invoices/${id}`, payload);
      }
      nav('/invoices');
    } catch (x) {
      alert(x.response?.data?.message || x.response?.data?.errors?.[0]?.msg || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{isNew ? 'New invoice' : `Edit ${invNum}`}</h2>
        {!isNew && id && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await downloadInvoicePdf(id, `invoice-${invNum}.pdf`);
                } catch {
                  alert('PDF download failed');
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700"
            >
              Download PDF
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Client *</label>
          <select
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">SAC (services)</label>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={sacCode}
            onChange={(e) => setSacCode(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Invoice date</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Due date *</label>
          <input
            type="date"
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Place of supply</label>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={placeOfSupply}
            onChange={(e) => setPlaceOfSupply(e.target.value)}
            placeholder="e.g. 27-MAHARASHTRA"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tax mode</label>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={taxMode}
            onChange={(e) => setTaxMode(e.target.value)}
          >
            <option value="intra">Intra-state (CGST+SGST)</option>
            <option value="inter">Inter-state (IGST)</option>
          </select>
        </div>
      </div>

      {taxMode === 'intra' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">CGST %</label>
            <input
              type="number"
              step="0.1"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={cgstRate}
              onChange={(e) => setCgstRate(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">SGST %</label>
            <input
              type="number"
              step="0.1"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={sgstRate}
              onChange={(e) => setSgstRate(Number(e.target.value))}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium">IGST %</label>
          <input
            type="number"
            step="0.1"
            className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={igstRate}
            onChange={(e) => setIgstRate(Number(e.target.value))}
          />
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">Line items</h3>
          <button type="button" onClick={addLine} className="text-sm text-brand">
            + Add row
          </button>
        </div>
        <div className="space-y-2">
          {items.map((l, ix) => (
            <div key={ix} className="grid gap-2 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-5">
                {ix === 0 && <span className="text-xs text-slate-500">Item</span>}
                <input
                  placeholder="Description"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={l.name}
                  onChange={(e) => setLine(ix, 'name', e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                {ix === 0 && <span className="text-xs text-slate-500">Rate (₹)</span>}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={l.rate}
                  onChange={(e) => setLine(ix, 'rate', e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                {ix === 0 && <span className="text-xs text-slate-500">Qty</span>}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={l.quantity}
                  onChange={(e) => setLine(ix, 'quantity', e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2 text-sm text-slate-600 dark:text-slate-400">
                {ix === 0 && <span className="text-xs text-slate-500">Line</span>}
                <p className="mt-1 py-1.5">
                  ₹
                  {new Intl.NumberFormat('en-IN').format(
                    Math.round((Number(l.rate) || 0) * (Number(l.quantity) || 0) * 100) / 100
                  )}
                </p>
              </div>
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={() => remLine(ix)}
                  className="text-sm text-red-600 disabled:opacity-30"
                  disabled={items.length < 2}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <h3 className="mb-2 text-sm font-semibold">Summary</h3>
        <dl className="grid max-w-sm gap-1 text-sm">
          <div className="flex justify-between">
            <dt>Taxable</dt>
            <dd>₹{new Intl.NumberFormat('en-IN').format(Math.round(preview.taxable * 100) / 100)}</dd>
          </div>
          {taxMode === 'intra' ? (
            <>
              <div className="flex justify-between">
                <dt>CGST</dt>
                <dd>₹{new Intl.NumberFormat('en-IN').format(Math.round(preview.cgst * 100) / 100)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>SGST</dt>
                <dd>₹{new Intl.NumberFormat('en-IN').format(Math.round(preview.sgst * 100) / 100)}</dd>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <dt>IGST</dt>
              <dd>₹{new Intl.NumberFormat('en-IN').format(Math.round(preview.igst * 100) / 100)}</dd>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-700">
            <dt>Total</dt>
            <dd>₹{new Intl.NumberFormat('en-IN').format(Math.round(preview.total * 100) / 100)}</dd>
          </div>
        </dl>
        <div className="mt-3">
          <label className="text-sm font-medium">Amount paid (optional)</label>
          <input
            type="number"
            min="0"
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          rows={2}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {!isNew && (
        <div className="rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-600">
          <h3 className="mb-2 text-sm font-semibold">Email PDF to client</h3>
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              placeholder="client@email.com"
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
            />
            <button
              type="button"
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white dark:bg-slate-200 dark:text-slate-900"
              onClick={async () => {
                if (!emailTo) return alert('Enter email');
                try {
                  await api.post(`/invoices/${id}/email`, { to: emailTo });
                  alert('Email sent (if SMTP is configured)');
                } catch (x) {
                  alert(x.response?.data?.message || 'Failed');
                }
              }}
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Requires SMTP in backend .env</p>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save invoice'}
        </button>
        <button
          type="button"
          onClick={() => nav(-1)}
          className="rounded-lg border border-slate-200 px-5 py-2 text-sm dark:border-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
