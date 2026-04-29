import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

export const updateProfile = async (req, res) => {
  const b = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (b.name) user.name = b.name;
  user.company = user.company || {};
  if (b.company) {
    let c = b.company;
    if (typeof c === 'string') {
      try {
        c = JSON.parse(c);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid company JSON' });
      }
    }
    if (c.name != null) user.company.name = c.name;
    if (c.gstin != null) user.company.gstin = c.gstin;
    if (c.phone != null) user.company.phone = c.phone;
    if (c.email != null) user.company.email = c.email;
    if (c.website != null) user.company.website = c.website;
    if (c.sacCode != null) user.company.sacCode = c.sacCode;
    if (c.upiId != null) user.company.upiId = c.upiId;
    if (c.bankName != null) user.company.bankName = c.bankName;
    if (c.bankAccount != null) user.company.bankAccount = c.bankAccount;
    if (c.ifsc != null) user.company.ifsc = c.ifsc;
    if (c.branch != null) user.company.branch = c.branch;
    if (Array.isArray(c.addressLines)) user.company.addressLines = c.addressLines;
  }
  if (req.file) {
    const rel = `uploads/${req.file.filename}`;
    if (user.company.logoPath) {
      const oldAbs = path.join(projectRoot, user.company.logoPath);
      if (fs.existsSync(oldAbs)) {
        try {
          fs.unlinkSync(oldAbs);
        } catch {
          /* */
        }
      }
    }
    user.company.logoPath = rel;
  }
  await user.save();
  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, company: user.company, invoiceCounter: user.invoiceCounter },
  });
};
