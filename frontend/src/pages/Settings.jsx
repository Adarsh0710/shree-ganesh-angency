import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Settings() {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    company: {
      name: '',
      gstin: '',
      phone: '',
      email: '',
      website: '',
      upiId: '',
      bankName: '',
      bankAccount: '',
      ifsc: '',
      branch: '',
      sacCode: '9954',
      addressLines: '',
    },
  });
  const [logo, setLogo] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/auth/me').then((r) => {
      const u = r.data.user;
      setForm({
        name: u.name,
        company: {
          name: u.company?.name || '',
          gstin: u.company?.gstin || '',
          phone: u.company?.phone || '',
          email: u.company?.email || '',
          website: u.company?.website || '',
          upiId: u.company?.upiId || '',
          bankName: u.company?.bankName || '',
          bankAccount: u.company?.bankAccount || '',
          ifsc: u.company?.ifsc || '',
          branch: u.company?.branch || '',
          sacCode: u.company?.sacCode || '9954',
          addressLines: (u.company?.addressLines || []).join('\n'),
        },
      });
    });
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append(
      'company',
      JSON.stringify({
        ...form.company,
        addressLines: form.company.addressLines
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      })
    );
    if (logo) fd.append('logo', logo);
    try {
      await api.put('/user', fd);
      await refreshUser();
      setLogo(null);
      setMsg('Profile saved. PDFs will use these details and logo.');
    } catch (x) {
      setMsg(x.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-lg font-semibold">Company &amp; PDF</h2>
      <p className="mb-4 text-sm text-slate-500">These values appear on generated tax invoice PDFs (header, bank, UPI QR).</p>
      {msg && <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Shree Ganesh Agency</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Shree Ganesh Agency (appears on PDF)</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.company.name}
            onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, name: e.target.value } }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Logo (PNG/JPG, max 2MB)</label>
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm"
            onChange={(e) => setLogo(e.target.files?.[0] || null)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">GSTIN</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.company.gstin}
            onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, gstin: e.target.value } }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Address (one line per row)</label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={form.company.addressLines}
            onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, addressLines: e.target.value } }))}
            placeholder="Edward Apartment, Street…, City, State, Pin"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Mobile</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={form.company.phone}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, phone: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={form.company.email}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, email: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Website</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={form.company.website}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, website: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">UPI for QR</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={form.company.upiId}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, upiId: e.target.value } }))}
              placeholder="name@ybl or phone@paytm"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Bank</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.company.bankName}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, bankName: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">A/C</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.company.bankAccount}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, bankAccount: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">IFSC</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.company.ifsc}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, ifsc: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Branch</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.company.branch}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, branch: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default SAC</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.company.sacCode}
              onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, sacCode: e.target.value } }))}
            />
          </div>
        </div>
        <button type="submit" className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white">
          Save
        </button>
      </form>
    </div>
  );
}
