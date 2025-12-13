import mongoose from "mongoose";

const CancelledSubscriptionSchema = new mongoose.Schema({
  // Original subscription data
  originalSubscriptionId: { type: String, required: true },
  originalDonorId: { type: String, required: true },
  razorpaySubscriptionId: { type: String, default: null },
  planId: { type: String, default: null },
  
  // Subscriber details
  name: { type: String, required: true },
  email: { type: String, default: null },
  phone: { type: String, required: true },
  district: { type: String, default: null },
  panchayat: { type: String, default: null },
  
  // Subscription details
  amount: { type: Number, required: true },
  period: { type: String, enum: ["daily", "weekly", "monthly", "yearly"], required: true },
  method: { type: String, enum: ["auto", "manual"], required: true },
  
  // Cancellation details
  cancelledAt: { type: Date, default: Date.now, required: true },
  cancelledBy: { type: String, default: "admin" }, // Could be "admin", "user", "system"
  cancellationReason: { type: String, default: "User requested" },
  
  // Original subscription timeline
  originalCreatedAt: { type: Date, required: true },
  lastPaymentAt: { type: Date, default: null },
  totalPaymentsMade: { type: Number, default: 0 },
  totalAmountPaid: { type: Number, default: 0 },
  subscriptionDuration: { type: Number, default: 0 }, // Duration in days
  
  // Status tracking
  razorpayCancellationStatus: { type: String, enum: ["success", "failed", "not_applicable"], default: "not_applicable" },
  notificationSent: { type: Boolean, default: false },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
}, { 
  collection: "cancelled_subscriptions",
  timestamps: true 
});

// Indexes for better performance
CancelledSubscriptionSchema.index({ cancelledAt: -1 });
CancelledSubscriptionSchema.index({ method: 1 });
CancelledSubscriptionSchema.index({ phone: 1 });
CancelledSubscriptionSchema.index({ originalSubscriptionId: 1 });
CancelledSubscriptionSchema.index({ razorpaySubscriptionId: 1 });

export default mongoose.models.CancelledSubscription || mongoose.model("CancelledSubscription", CancelledSubscriptionSchema);
