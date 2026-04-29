/**
 * Recalculate invoice totals from line items and tax mode.
 */
export function calculateInvoiceTotals(items, taxMode, rates = {}) {
  const cgstR = rates.cgstRate ?? 9;
  const sgstR = rates.sgstRate ?? 9;
  const igstR = rates.igstRate ?? 18;

  const taxable = items.reduce((sum, line) => {
    const lineAmt = Number(line.rate) * Number(line.quantity);
    return sum + lineAmt;
  }, 0);

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

  return {
    items: items.map((line) => ({
      ...line,
      amount: Math.round(Number(line.rate) * Number(line.quantity) * 100) / 100,
    })),
    taxableAmount: Math.round(taxable * 100) / 100,
    cgstAmount: Math.round(cgst * 100) / 100,
    sgstAmount: Math.round(sgst * 100) / 100,
    igstAmount: Math.round(igst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
