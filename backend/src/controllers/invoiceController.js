import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import { calculateInvoiceTotals } from '../utils/invoiceCalc.js';
import { buildInvoicePDFBuffer } from '../services/pdfService.js';
import { sendInvoiceEmail } from '../services/emailService.js';

const applyStatus = (inv) => {
  const paid = inv.amountPaid || 0;
  if (paid <= 0) inv.status = 'unpaid';
  else if (paid >= inv.total - 0.01) inv.status = 'paid';
  else inv.status = 'partial';
};

export const getSummary = async (req, res) => {
  const uid = req.user._id;
  const invoices = await Invoice.find({ user: uid }).lean();
  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + (i.total || 0), 0);
  const pending = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((s, i) => s + Math.max(0, (i.total || 0) - (i.amountPaid || 0)), 0);
  res.json({
    success: true,
    data: {
      totalInvoices: invoices.length,
      revenue: Math.round(totalRevenue * 100) / 100,
      pendingPayments: Math.round(pending * 100) / 100,
      byMonth: aggregateByMonth(invoices),
    },
  });
};

function aggregateByMonth(invoices) {
  const m = {};
  for (const inv of invoices) {
    const d = new Date(inv.invoiceDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!m[key]) m[key] = { key, count: 0, total: 0 };
    m[key].count += 1;
    m[key].total += inv.total || 0;
  }
  return Object.values(m)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((v) => ({
      month: v.key,
      count: v.count,
      total: Math.round(v.total * 100) / 100,
    }));
}

export const listInvoices = async (req, res) => {
  const { search, status } = req.query;
  const filter = { user: req.user._id };
  if (status && status !== 'all') filter.status = status;
  let inv = await Invoice.find(filter)
    .populate('client', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  if (search) {
    const s = new RegExp(search, 'i');
    inv = inv.filter((i) => s.test(i.invoiceNumber) || (i.client && s.test(i.client.name || '')));
  }
  res.json({ success: true, data: inv });
};

export const getInvoice = async (req, res) => {
  const i = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
    .populate('client')
    .lean();
  if (!i) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.json({ success: true, data: i });
};

export const createInvoice = async (req, res) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ success: false, errors: e.array() });
  const body = req.body;
  const client = await Client.findOne({ _id: body.clientId, user: req.user._id });
  if (!client) return res.status(400).json({ success: false, message: 'Client not found' });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { invoiceCounter: 1 } },
    { new: true }
  );
  const num = `INV-${String(user.invoiceCounter).padStart(5, '0')}`;

  const taxMode = body.taxMode === 'inter' ? 'inter' : 'intra';
  const itemsIn = (body.items || []).map((x) => ({
    name: x.name,
    rate: Number(x.rate),
    quantity: Number(x.quantity),
    amount: Number(x.rate) * Number(x.quantity),
  }));
  const calc = calculateInvoiceTotals(itemsIn, taxMode, {
    cgstRate: Number(body.cgstRate) || 9,
    sgstRate: Number(body.sgstRate) || 9,
    igstRate: Number(body.igstRate) || 18,
  });

  const inv = await Invoice.create({
    user: req.user._id,
    client: client._id,
    invoiceNumber: num,
    invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
    dueDate: new Date(body.dueDate),
    placeOfSupply: body.placeOfSupply || '27-MAHARASHTRA',
    sacCode: body.sacCode || user.company?.sacCode || '9954',
    taxMode,
    cgstRate: Number(body.cgstRate) || 9,
    sgstRate: Number(body.sgstRate) || 9,
    igstRate: Number(body.igstRate) || 18,
    items: calc.items,
    taxableAmount: calc.taxableAmount,
    cgstAmount: taxMode === 'inter' ? 0 : calc.cgstAmount,
    sgstAmount: taxMode === 'inter' ? 0 : calc.sgstAmount,
    igstAmount: taxMode === 'inter' ? calc.igstAmount : 0,
    total: calc.total,
    amountPaid: Number(body.amountPaid) || 0,
    notes: body.notes,
  });
  applyStatus(inv);
  await inv.save();
  const populated = await Invoice.findById(inv._id).populate('client');
  res.status(201).json({ success: true, data: populated });
};

export const updateInvoice = async (req, res) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ success: false, errors: e.array() });
  const inv = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  if (req.body.clientId) {
    const c = await Client.findOne({ _id: req.body.clientId, user: req.user._id });
    if (!c) return res.status(400).json({ success: false, message: 'Client not found' });
    inv.client = c._id;
  }
  if (req.body.items) {
    const taxMode = inv.taxMode;
    const itemsIn = req.body.items.map((x) => ({
      name: x.name,
      rate: Number(x.rate),
      quantity: Number(x.quantity),
      amount: Number(x.rate) * Number(x.quantity),
    }));
    const calc = calculateInvoiceTotals(
      itemsIn,
      taxMode,
      { cgstRate: inv.cgstRate, sgstRate: inv.sgstRate, igstRate: inv.igstRate }
    );
    inv.items = calc.items;
    inv.taxableAmount = calc.taxableAmount;
    if (taxMode === 'inter') {
      inv.cgstAmount = 0;
      inv.sgstAmount = 0;
      inv.igstAmount = calc.igstAmount;
    } else {
      inv.cgstAmount = calc.cgstAmount;
      inv.sgstAmount = calc.sgstAmount;
      inv.igstAmount = 0;
    }
    inv.total = calc.total;
  }
  if (req.body.invoiceDate) inv.invoiceDate = new Date(req.body.invoiceDate);
  if (req.body.dueDate) inv.dueDate = new Date(req.body.dueDate);
  if (req.body.placeOfSupply) inv.placeOfSupply = req.body.placeOfSupply;
  if (req.body.sacCode) inv.sacCode = req.body.sacCode;
  if (req.body.notes != null) inv.notes = req.body.notes;
  if (req.body.taxMode === 'intra' || req.body.taxMode === 'inter') {
    inv.taxMode = req.body.taxMode;
    const calc = calculateInvoiceTotals(
      inv.items,
      inv.taxMode,
      { cgstRate: inv.cgstRate, sgstRate: inv.sgstRate, igstRate: inv.igstRate }
    );
    inv.items = calc.items;
    inv.taxableAmount = calc.taxableAmount;
    if (inv.taxMode === 'inter') {
      inv.cgstAmount = 0;
      inv.sgstAmount = 0;
      inv.igstAmount = calc.igstAmount;
    } else {
      inv.cgstAmount = calc.cgstAmount;
      inv.sgstAmount = calc.sgstAmount;
      inv.igstAmount = 0;
    }
    inv.total = calc.total;
  }
  if (req.body.cgstRate != null) inv.cgstRate = Number(req.body.cgstRate);
  if (req.body.sgstRate != null) inv.sgstRate = Number(req.body.sgstRate);
  if (req.body.igstRate != null) inv.igstRate = Number(req.body.igstRate);
  if (
    !req.body.items &&
    (req.body.cgstRate != null || req.body.sgstRate != null || req.body.igstRate != null)
  ) {
    const calc = calculateInvoiceTotals(inv.items, inv.taxMode, {
      cgstRate: inv.cgstRate,
      sgstRate: inv.sgstRate,
      igstRate: inv.igstRate,
    });
    inv.items = calc.items;
    inv.taxableAmount = calc.taxableAmount;
    if (inv.taxMode === 'inter') {
      inv.cgstAmount = 0;
      inv.sgstAmount = 0;
      inv.igstAmount = calc.igstAmount;
    } else {
      inv.cgstAmount = calc.cgstAmount;
      inv.sgstAmount = calc.sgstAmount;
      inv.igstAmount = 0;
    }
    inv.total = calc.total;
  }
  if (req.body.amountPaid != null) inv.amountPaid = Number(req.body.amountPaid);
  if (req.body.status === 'paid') {
    inv.amountPaid = inv.total;
  } else if (req.body.status === 'unpaid') {
    inv.amountPaid = 0;
  }
  applyStatus(inv);
  await inv.save();
  const out = await Invoice.findById(inv._id).populate('client');
  res.json({ success: true, data: out });
};

export const setPaid = async (req, res) => {
  const inv = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  if (req.body.paid === true) {
    inv.amountPaid = inv.total;
  } else if (req.body.paid === false) {
    inv.amountPaid = 0;
  } else {
    return res.status(400).json({ success: false, message: 'Body: { "paid": true | false }' });
  }
  applyStatus(inv);
  await inv.save();
  res.json({ success: true, data: inv });
};

export const deleteInvoice = async (req, res) => {
  const r = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!r) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.json({ success: true, message: 'Invoice deleted' });
};

export const downloadPDF = async (req, res) => {
  const i = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!i) return res.status(404).json({ success: false, message: 'Invoice not found' });
  const client = await Client.findById(i.client);
  if (!client) return res.status(400).json({ success: false, message: 'Client missing' });
  const user = await User.findById(req.user._id);
  const buffer = await buildInvoicePDFBuffer({ user, client, invoice: i.toObject() });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${i.invoiceNumber}.pdf"`);
  res.send(buffer);
};

export const emailInvoice = async (req, res) => {
  const i = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!i) return res.status(404).json({ success: false, message: 'Invoice not found' });
  const client = await Client.findById(i.client);
  if (!client) return res.status(400).json({ success: false, message: 'Client missing' });
  const to = req.body.to || client.email;
  if (!to) return res.status(400).json({ success: false, message: 'No email address' });
  const user = await User.findById(req.user._id);
  const buffer = await buildInvoicePDFBuffer({ user, client, invoice: i.toObject() });
  const result = await sendInvoiceEmail({
    to,
    subject: req.body.subject || `Tax Invoice ${i.invoiceNumber}`,
    text: req.body.text,
    pdfBuffer: buffer,
    filename: `invoice-${i.invoiceNumber}.pdf`,
  });
  if (!result.sent) {
    return res.status(500).json({ success: false, message: result.error || 'Failed to send email' });
  }
  res.json({ success: true, message: 'Email sent' });
};
