import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { numberToWordsINR } from '../utils/numberToWordsINR.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

function formatINR(n) {
  if (n == null || Number.isNaN(n)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

const TERMS = [
  'Payment is due within the number of days stated on the invoice from the date of invoice.',
  'Late payment may attract interest/penalty as per applicable law or mutual agreement.',
  'All amounts are in Indian National Rupee (INR) unless otherwise stated.',
  'Goods/Services are subject to applicable taxes as per the GST law.',
  'This is a computer-generated tax invoice; signature may be required for statutory purposes.',
  'Disputes, if any, shall be subject to the exclusive jurisdiction of courts in India.',
  'The supplier shall not be liable for any indirect or consequential loss.',
  'E-way bill / e-invoicing (if applicable) must be complied with as per government rules.',
  'Please quote invoice number in all remittance communications.',
];

export async function buildInvoicePDFBuffer({ user, client, invoice }) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Tax Invoice ${invoice.invoiceNumber}` } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const blue = '#005596';
    const W = 515;
    const leftX = 40;
    const pageRight = leftX + W;
    // Right-aligned header block (wider so "TAX INVOICE" stays on one line — avoids overlap with invoice #)
    const headerTitleW = 220;
    const headerRightX = pageRight - headerTitleW;
    const headerTop = 40;
    const maxLogoW = 200;
    const maxLogoH = 52;

    // —— Logo (left) — use fit to preserve aspect ratio, no forced stretch
    const logoRel = user.company?.logoPath;
    let leftColumnBottom = headerTop;
    if (logoRel) {
      const abs = path.isAbsolute(logoRel) ? logoRel : path.join(projectRoot, logoRel);
      if (fs.existsSync(abs)) {
        try {
          doc.image(abs, leftX, headerTop, { fit: [maxLogoW, maxLogoH] });
          leftColumnBottom = headerTop + maxLogoH + 10;
        } catch {
          // ignore bad image
        }
      }
    }

    // —— Title + invoice # (right column, stacked — no y overlap)
    const titleY = headerTop;
    doc.fillColor(blue).font('Helvetica-Bold').fontSize(18);
    doc.text('TAX INVOICE', headerRightX, titleY, {
      width: headerTitleW,
      align: 'right',
      lineGap: 0,
    });
    const afterTitleY = titleY + 24;
    doc.font('Helvetica').fontSize(10).fillColor('#111');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, headerRightX, afterTitleY, {
      width: headerTitleW,
      align: 'right',
      lineGap: 0,
    });
    const rightColumnBottom = afterTitleY + 12;

    // Start company block after the lower of left (logo) or right (title) area
    let y = Math.max(leftColumnBottom, rightColumnBottom) + 4;

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111');
    doc.text(user.company?.name || 'Your Company', leftX, y);
    y += 16;
    doc.font('Helvetica').fontSize(9);
    if (user.company?.gstin) {
      doc.text(`GSTIN: ${user.company.gstin}`, leftX, y);
      y += 12;
    }
    const addr = user.company?.addressLines?.filter(Boolean) || [];
    for (const line of addr) {
      doc.text(line, leftX, y, { width: 240 });
      y += 11;
    }
    y += 2;
    if (user.company?.phone) {
      doc.text(`M: ${user.company.phone}`, leftX, y);
      y += 11;
    }
    if (user.company?.email) {
      doc.text(`Email: ${user.company.email}`, leftX, y);
      y += 11;
    }
    if (user.company?.website) {
      doc.text(`Web: ${user.company.website}`, leftX, y);
      y += 11;
    }
    y += 8;

    // —— Two columns: Bill to | Meta ——
    const colTop = y;
    const midGap = 280;
    doc.font('Helvetica-Bold').text('Bill To:', leftX, y);
    y += 12;
    doc.font('Helvetica').fontSize(10);
    doc.text(client.name, leftX, y, { width: 240 });
    y += 13;
    if (client.gstin) {
      doc.text(`GSTIN: ${client.gstin}`, leftX, y, { width: 240 });
      y += 12;
    }
    const caddr = client.addressLines?.filter(Boolean) || [];
    for (const line of caddr) {
      doc.text(line, leftX, y, { width: 240 });
      y += 11;
    }
    if (client.phone) {
      doc.text(`M: ${client.phone}`, leftX, y, { width: 240 });
      y += 12;
    }
    if (client.email) {
      doc.text(`Email: ${client.email}`, leftX, y, { width: 240 });
      y += 12;
    }

    const yRight = colTop;
    const rx = leftX + midGap;
    const fmtD = (d) =>
      d
        ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
    let ry = yRight;
    doc.font('Helvetica').fontSize(9);
    doc.text(`Invoice Date: ${fmtD(invoice.invoiceDate)}`, rx, ry, { width: 220, align: 'right' });
    ry += 12;
    doc.text(`Due Date: ${fmtD(invoice.dueDate)}`, rx, ry, { width: 220, align: 'right' });
    ry += 12;
    doc.text(`Place of Supply: ${invoice.placeOfSupply || '—'}`, rx, ry, { width: 220, align: 'right' });
    y = Math.max(y, ry + 16) + 8;

    // —— Table ——
    const tableX = leftX;
    const colW = [24, 190, 78, 36, 100];
    doc.moveTo(tableX, y).lineTo(tableX + W, y).strokeColor('#999').lineWidth(0.5).stroke();
    y += 6;
    doc.font('Helvetica-Bold').fontSize(9);
    const headers = ['#', 'Item', 'Rate / Item', 'Qty', 'Amount'];
    let cx = tableX;
    for (let i = 0; i < 5; i++) {
      doc.text(headers[i], cx + 2, y, { width: colW[i] - 4, align: i >= 2 ? 'right' : 'left' });
      cx += colW[i];
    }
    y += 16;
    doc.moveTo(tableX, y).lineTo(tableX + W, y).stroke();
    y += 6;
    doc.font('Helvetica');
    const items = invoice.items || [];
    items.forEach((row, i) => {
      cx = tableX;
      const rowY = y;
      doc.text(String(i + 1), cx + 2, rowY, { width: colW[0] });
      cx += colW[0];
      doc.text(row.name, cx + 2, rowY, { width: colW[1] });
      cx += colW[1];
      doc.text(formatINR(row.rate), cx + 2, rowY, { width: colW[2] - 4, align: 'right' });
      cx += colW[2];
      doc.text(String(row.quantity), cx + 2, rowY, { width: colW[3] - 4, align: 'right' });
      cx += colW[3];
      doc.text(`₹ ${formatINR(row.amount)}`, cx + 2, rowY, { width: colW[4] - 4, align: 'right' });
      y += 32;
    });
    doc.moveTo(tableX, y - 2).lineTo(tableX + W, y - 2).stroke();
    y += 12;

    // —— Bank + UPI QR + amount in words (compact row) ——
    const bankY = y;
    doc.font('Helvetica-Bold').fontSize(8).text('Bank Details', leftX, bankY);
    doc.font('Helvetica').fontSize(7);
    let by = bankY + 9;
    if (user.company?.bankName) {
      doc.text(`Bank: ${user.company.bankName}`, leftX, by);
      by += 8;
    }
    if (user.company?.bankAccount) {
      doc.text(`A/C: ${user.company.bankAccount}`, leftX, by);
      by += 8;
    }
    if (user.company?.ifsc) {
      doc.text(`IFSC: ${user.company.ifsc}`, leftX, by);
      by += 8;
    }
    if (user.company?.branch) {
      doc.text(`Branch: ${user.company.branch}`, leftX, by);
      by += 8;
    }

    // QR center
    if (user.company?.upiId) {
      try {
        const png = await QRCode.toBuffer(`upi://pay?pa=${encodeURIComponent(user.company.upiId)}&cu=INR`, { width: 90, margin: 0 });
        doc.image(png, tableX + W / 2 - 45, bankY - 4, { width: 90, height: 90 });
        doc.font('Helvetica-Bold').fontSize(7).text('Pay using UPI:', tableX + W / 2 - 50, bankY - 10, { width: 100, align: 'center' });
      } catch {
        /* */
      }
    }

    const wordsY = bankY + 100;
    doc.fillColor('#111')
      .font('Helvetica')
      .fontSize(7)
      .text(`Total amount (in words):`, leftX, wordsY, { width: W - 10 });
    doc.text(numberToWordsINR(invoice.total), leftX, wordsY + 8, { width: W - 20 });

    y = wordsY + 44;

    // —— Right summary box ——
    const boxW = 200;
    const boxX = leftX + W - boxW;
    const bl = 10;
    const sac = invoice.sacCode || '9954';
    doc.fillColor('#111');
    const row = (label, val, bold) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8)
        .text(label, boxX, y, { width: boxW - 70, align: 'left' });
      doc.text(val, boxX + boxW - 80, y, { width: 70, align: 'right' });
      y += bl;
    };
    if (invoice.taxMode === 'inter') {
      row('Taxable Amount', `₹ ${formatINR(invoice.taxableAmount)}`, false);
      row(`IGST (${invoice.igstRate}%)`, `₹ ${formatINR(invoice.igstAmount)}`, false);
    } else {
      row(`Service Charges (SAC: ${sac})`, `₹ ${formatINR(invoice.taxableAmount)}`, false);
      row('Taxable Amount', `₹ ${formatINR(invoice.taxableAmount)}`, false);
      row(`CGST (${invoice.cgstRate}%)`, `₹ ${formatINR(invoice.cgstAmount)}`, false);
      row(`SGST (${invoice.sgstRate}%)`, `₹ ${formatINR(invoice.sgstAmount)}`, false);
    }
    y += 2;
    const totalY = y;
    doc.lineWidth(1.5);
    doc.rect(boxX, totalY - 1, boxW, 15).stroke(blue);
    doc.fillColor('#111');
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('Total', boxX + 2, totalY, { width: boxW - 80 });
    doc.text(`₹ ${formatINR(invoice.total)}`, boxX + boxW - 80, totalY, { width: 76, align: 'right' });
    y = totalY + 18;
    row('Amount Payable', `₹ ${formatINR(invoice.total - (invoice.amountPaid || 0))}`, false);
    const paid = invoice.amountPaid || 0;
    row('Amount Paid', `₹ ${formatINR(paid)}`, false);
    y += 16;

    // Notes + terms
    doc.fillColor('#111');
    doc.font('Helvetica-Oblique').fontSize(9).text(invoice.notes || 'Thank you for the Business!', leftX, y, { width: W });
    y += 18;
    doc.font('Helvetica-Bold').fontSize(8).text('Terms and Conditions', leftX, y);
    y += 9;
    doc.font('Helvetica').fontSize(6.5);
    TERMS.forEach((t, i) => {
      doc.text(`${i + 1}. ${t}`, leftX, y, { width: W - 60 });
      y += 22;
    });
    y += 8;
    doc.moveTo(leftX, y).lineTo(leftX + 160, y).strokeColor('#333');
    y += 6;
    doc.font('Helvetica').fontSize(7).text("Receiver's Signature", leftX, y);
    y += 24;
    if (y > 760) {
      /* avoid overflow: minimal A4 = 842pt height, margin 40*2; safe ~762 */
    }

    doc.end();
  });
}
