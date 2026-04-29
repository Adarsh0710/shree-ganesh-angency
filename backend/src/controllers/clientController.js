import { validationResult } from 'express-validator';
import Client from '../models/Client.js';

export const listClients = async (req, res) => {
  const q = req.query.search;
  const filter = { user: req.user._id };
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') },
    ];
  }
  const clients = await Client.find(filter).sort({ updatedAt: -1 });
  res.json({ success: true, data: clients });
};

export const getClient = async (req, res) => {
  const c = await Client.findOne({ _id: req.params.id, user: req.user._id });
  if (!c) return res.status(404).json({ success: false, message: 'Client not found' });
  res.json({ success: true, data: c });
};

export const createClient = async (req, res) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ success: false, errors: e.array() });
  const { name, email, phone, gstin, addressLines } = req.body;
  const client = await Client.create({
    user: req.user._id,
    name,
    email: email || '',
    phone: phone || '',
    gstin: gstin || '',
    addressLines: Array.isArray(addressLines) ? addressLines : addressLines ? [addressLines] : [],
  });
  res.status(201).json({ success: true, data: client });
};

export const updateClient = async (req, res) => {
  const c = await Client.findOne({ _id: req.params.id, user: req.user._id });
  if (!c) return res.status(404).json({ success: false, message: 'Client not found' });
  const { name, email, phone, gstin, addressLines } = req.body;
  if (name != null) c.name = name;
  if (email != null) c.email = email;
  if (phone != null) c.phone = phone;
  if (gstin != null) c.gstin = gstin;
  if (addressLines != null) c.addressLines = Array.isArray(addressLines) ? addressLines : [addressLines];
  await c.save();
  res.json({ success: true, data: c });
};

export const deleteClient = async (req, res) => {
  const c = await Client.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!c) return res.status(404).json({ success: false, message: 'Client not found' });
  res.json({ success: true, message: 'Client deleted' });
};
