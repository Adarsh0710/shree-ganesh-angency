import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    // line amount before tax = rate * quantity
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    placeOfSupply: { type: String, default: '27-MAHARASHTRA' },
    sacCode: { type: String, default: '9954' },
    items: [lineItemSchema],
    // Intra-state: CGST+SGST; inter-state: use igstMode
    taxMode: { type: String, enum: ['intra', 'inter'], default: 'intra' },
    cgstRate: { type: Number, default: 9 },
    sgstRate: { type: Number, default: 9 },
    igstRate: { type: Number, default: 18 },
    taxableAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['unpaid', 'paid', 'partial'], default: 'unpaid' },
    notes: { type: String, default: 'Thank you for the Business!' },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Invoice', invoiceSchema);
