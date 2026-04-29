// export async function downloadInvoicePdf(id, filename = 'invoice.pdf') {
//   const t = localStorage.getItem('token');
//   const r = await fetch(`/api/invoices/${id}/pdf`, {
//     headers: t ? { Authorization: `Bearer ${t}` } : {},
//   });
//   if (!r.ok) throw new Error('Failed to download PDF');
//   const blob = await r.blob();
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = filename;
//   a.click();
//   URL.revokeObjectURL(url);
// }


export async function downloadInvoicePdf(id, filename = 'invoice.pdf') {
  const token = localStorage.getItem('token');

  // ✅ detect local vs production
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const BASE = isLocal
    ? '' // local → vite proxy works
    : 'https://shree-ganesh-angency.onrender.com'; // production

  const res = await fetch(`${BASE}/api/invoices/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    console.error('PDF download failed:', res.status);
    throw new Error('Failed to download PDF');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
