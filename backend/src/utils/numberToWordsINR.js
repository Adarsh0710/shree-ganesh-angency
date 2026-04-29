const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ones[n];
  return `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''}`;
}

function threeDigits(n) {
  if (n === 0) return '';
  if (n < 100) return twoDigits(n);
  return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' + twoDigits(n % 100) : ''}`;
}

/**
 * Indian numbering: Crores, Lakhs, Thousand...
 */
export function numberToWordsINR(num) {
  if (num === 0) return 'Zero';
  const n = Math.floor(Math.abs(num));
  if (n > 999999999999) return 'Amount too large';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rem = n % 1000;

  const parts = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore${crore > 1 ? 's' : ''}`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh${lakh > 1 ? 's' : ''}`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rem) parts.push(threeDigits(rem));

  const paisa = Math.round((Math.abs(num) - n) * 100);
  let s = `INR ${parts.join(' ').replace(/\s+/g, ' ').trim()}`;
  if (paisa > 0) s += ` And ${twoDigits(paisa)} Paisa`;
  s += ' Only.';
  return s;
}
