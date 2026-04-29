import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Your Company' },
    logoPath: { type: String, default: '' },
    gstin: { type: String, default: '' },
    addressLines: [{ type: String }],
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    branch: { type: String, default: '' },
    upiId: { type: String, default: '' },
    sacCode: { type: String, default: '9954' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    company: { type: companySchema, default: () => ({}) },
    invoiceCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
