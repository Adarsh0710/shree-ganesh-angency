import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    gstin: { type: String, trim: true, default: '' },
    addressLines: [{ type: String }],
  },
  { timestamps: true }
);

clientSchema.index({ user: 1, email: 1 });

export default mongoose.model('Client', clientSchema);
