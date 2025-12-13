import mongoose from "mongoose";

const SponsorSchema = new mongoose.Schema({
  selectedAmount: { type: Number, required: true }, // Selected sponsorship amount
  paidAmount: { type: Number, default: 0 }, // Raised amount
  method: { type: String, enum: ["Complete", "Split"], default: "Split" }, // Payment method
  name: { type: String },
  phone: { type: String, required: true },
  type: { type: String, enum: ["Sponsor-Yatheem", "Sponsor-Hafiz"], required: true },
  email: { type: String },
  period: { type: String, required: true },
  district: { type: String },
  panchayat: { type: String },
  status: { type: String, required: true, default: "Pending" }, // Pending, Partial, Completed
  yatheemId: { type: mongoose.Schema.Types.ObjectId, ref: "Yatheem" }, // Reference to assigned yatheem
  userId: { type: String }, // User identifier for dashboard access
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


export default mongoose.models.Sponsor || mongoose.model("Sponsor", SponsorSchema);

