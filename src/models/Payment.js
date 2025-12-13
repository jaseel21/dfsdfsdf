import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: "Sponsor", required: true },
  amount: { type: Number, required: true },
  razorpayPaymentId: { type: String, required: true },
  razorpayOrderId: { type: String, required: true },
  razorpaySignature: { type: String },
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "failed", "pending"], default: "success" },
  type: { type: String, enum: ["main", "extra"], default: "main" }, // main = regular payment, extra = extra expense payment
}, {
  timestamps: true,
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

