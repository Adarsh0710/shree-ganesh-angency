import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/generateToken.js';

export const register = async (req, res) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ success: false, errors: e.array() });
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, company: user.company },
  });
};

export const login = async (req, res) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ success: false, errors: e.array() });
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (user && (await user.matchPassword(password))) {
    return res.json({
      success: true,
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, company: user.company },
    });
  }
  res.status(401).json({ success: false, message: 'Invalid email or password' });
};

export const getMe = async (req, res) => {
  const u = await User.findById(req.user._id);
  res.json({
    success: true,
    user: { id: u._id, name: u.name, email: u.email, company: u.company, invoiceCounter: u.invoiceCounter },
  });
};
