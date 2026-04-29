import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { downloadInvoicePdf } from '../utils/downloadPdf.js';

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

export default function Invoices() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/invoices', { params: { search, status } })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const del = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    load();
  };

  const pdf = async (id, num) => {
    try {
      await downloadInvoicePdf(id, `invoice-${num || id}.pdf`);
    } catch {
      alert('Could not download PDF');
    }
  };

  const mark = async (id, paid) => {
    await api.post(`/invoices/${id}/paid`, { paid });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            placeholder="Search number or client…"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
          </select>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          + New invoice
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading…</p>
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No invoices yet</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i._id} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="px-4 py-3 font-medium text-brand">{i.invoiceNumber}</td>
                  <td className="px-4 py-3">{i.client?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">{formatINR(i.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        i.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : i.status === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button type="button" onClick={() => pdf(i._id, i.invoiceNumber)} className="text-xs text-brand hover:underline">
                        PDF
                      </button>
                      <Link to={`/invoices/${i._id}`} className="text-xs text-slate-600 hover:underline dark:text-slate-400">
                        Edit
                      </Link>
                      {i.status !== 'paid' && (
                        <button type="button" onClick={() => mark(i._id, true)} className="text-xs text-emerald-600 hover:underline">
                          Paid
                        </button>
                      )}
                      {i.status === 'paid' && (
                        <button type="button" onClick={() => mark(i._id, false)} className="text-xs text-amber-600 hover:underline">
                          Unpaid
                        </button>
                      )}
                      <button type="button" onClick={() => del(i._id)} className="text-xs text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
