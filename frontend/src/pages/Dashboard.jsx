import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api/client.js';

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get('/invoices/summary')
      .then((r) => setData(r.data.data))
      .catch((e) => setErr(e.response?.data?.message || 'Failed to load'));
  }, []);

  if (err) {
    return <p className="text-red-600">{err}</p>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  const chartData = (data.byMonth || []).map((b) => ({
    name: b.month,
    total: b.total,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total invoices</p>
          <p className="mt-1 text-2xl font-semibold">{data.totalInvoices}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Revenue (paid)</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(data.revenue)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Pending payments</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{formatINR(data.pendingPayments)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Revenue by month</h2>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatINR(v), 'Total']} labelFormatter={(l) => l} />
                <Area type="monotone" dataKey="total" stroke="#005596" fill="#005596" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-slate-500">Create invoices to see the chart</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/invoices/new"
          className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand/90"
        >
          New invoice
        </Link>
        <Link
          to="/clients"
          className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          Add client
        </Link>
      </div>
    </div>
  );
}
