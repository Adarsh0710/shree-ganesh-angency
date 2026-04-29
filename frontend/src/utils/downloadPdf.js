export async function downloadInvoicePdf(id, filename = 'invoice.pdf') {
  const t = localStorage.getItem('token');
  const r = await fetch(`/api/invoices/${id}/pdf`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  if (!r.ok) throw new Error('Failed to download PDF');
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
