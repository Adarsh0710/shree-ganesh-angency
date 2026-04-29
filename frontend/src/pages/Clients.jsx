import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function Clients() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', gstin: '', addressLines: '' });

  const load = () => {
    api.get('/clients', { params: { search: q } }).then((r) => setList(r.data.data));
  };
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing('new');
    setForm({ name: '', email: '', phone: '', gstin: '', addressLines: '' });
  };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      gstin: c.gstin || '',
      addressLines: (c.addressLines || []).join('\n'),
    });
  };

  const save = async (e) => {
    e.preventDefault();
    const addr = form.addressLines
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (editing === 'new') {
      await api.post('/clients', { ...form, addressLines: addr });
    } else {
      await api.put(`/clients/${editing}`, { ...form, addressLines: addr });
    }
    setEditing(null);
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this client?')) return;
    await api.delete(`/clients/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          placeholder="Search…"
          className="max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" onClick={openNew} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
          + Add client
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 font-semibold">{editing === 'new' ? 'New client' : 'Edit client'}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Name *</label>
              <input
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm">Phone</label>
              <input
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm">GSTIN</label>
              <input
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm">Address (one line per row)</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.addressLines}
                onChange={(e) => setForm((f) => ({ ...f, addressLines: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded bg-brand px-3 py-1.5 text-sm text-white">
              Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-slate-500">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">GSTIN</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c._id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 text-slate-600">{c.email || '—'}</td>
                <td className="px-4 py-2">{c.phone || '—'}</td>
                <td className="px-4 py-2 text-xs">{c.gstin || '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button type="button" onClick={() => openEdit(c)} className="text-xs text-brand">
                    Edit
                  </button>{' '}
                  <button type="button" onClick={() => del(c._id)} className="text-xs text-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-center text-slate-500">No clients</p>}
      </div>
    </div>
  );
}
