import crypto from "crypto";
import { buffer } from "micro";
import connectDB from "@/lib/db";
import Donation from "@/models/Donation"; // Mongoose model for donations
import WebhookLog from "@/models/WebhookLog"; // Mongoose model for webhook logs
import { standardizePhone } from "@/utils/phone"; // helper to clean/validate phone
import { sendWhatsAppMessage } from "@/lib/twilio"; // Optional: only if using Twilio
import { updateSubscriptionStatus } from "@/lib/api"; // Optional: to update your backend DB

export const config = {
  api: {
    bodyParser: false, // Required for raw body parsing
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const rawBody = await buffer(req);
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const eventType = event.event;
  const payload = event.payload;

  await connectDB();

  // Log every webhook for auditing
  await WebhookLog.create({
    message: "Webhook triggered",
    event: eventType,
    timestamp: new Date(),
  });

  switch (eventType) {
    case "payment.captured":
      await handlePaymentCaptured(payload.payment.entity);
      break;

    case "subscription.activated":
      await handleSubscriptionActivated(payload.subscription.entity);
      break;

    case "subscription.charged":
      await handleSubscriptionCharged(payload.payment.entity);
      break;

    case "payment.failed":
      await handlePaymentFailed(payload.payment.entity);
      break;

    default:
      console.log("Unhandled event type:", eventType);
  }

  res.status(200).json({ received: true });
}

// ========== Event Handlers ==========

async function handlePaymentCaptured(payment) {
  const { id, email, contact, amount, notes } = payment;

  const phone = standardizePhone(contact);
  if (!phone) return;

  const duplicate = await Donation.findOne({ razorpayPaymentId: id });
  if (duplicate) return;

  await Donation.create({
    razorpayPaymentId: id,
    amount: amount / 100,
    email,
    phone,
    name: notes?.name || "Anonymous",
    type: notes?.donationType || "one-time",
    createdAt: new Date(),
  });

  if (process.env.TWILIO_SID) {
    await sendWhatsAppMessage(phone, `Thanks for your donation!`);
  }
}

async function handleSubscriptionActivated(subscription) {
  const { id, customer_email, customer_contact } = subscription;

  const phone = standardizePhone(customer_contact);
  if (!phone) return;

  const duplicate = await Donation.findOne({ razorpaySubscriptionId: id });
  if (duplicate) return;

  await Donation.create({
    razorpaySubscriptionId: id,
    email: customer_email,
    phone,
    amount: 0,
    name: "Subscription Activated",
    type: "subscription",
    createdAt: new Date(),
  });

  if (process.env.API_BASE_URL) {
    await updateSubscriptionStatus(id, "active");
  }
}

async function handleSubscriptionCharged(payment) {
  const { id, email, contact, amount, subscription_id } = payment;

  const phone = standardizePhone(contact);
  if (!phone) return;

  const duplicate = await Donation.findOne({ razorpayPaymentId: id });
  if (duplicate) return;

  await Donation.create({
    razorpayPaymentId: id,
    razorpaySubscriptionId: subscription_id,
    amount: amount / 100,
    email,
    phone,
    name: "Subscription Payment",
    type: "subscription",
    createdAt: new Date(),
  });

  if (process.env.TWILIO_SID) {
    await sendWhatsAppMessage(phone, `Thanks for your recurring donation!`);
  }
}

async function handlePaymentFailed(payment) {
  const { email, contact } = payment;
  const phone = standardizePhone(contact);

  if (process.env.TWILIO_SID && phone) {
    await sendWhatsAppMessage(phone, `Payment failed. Please try again.`);
  }

  console.log("Payment failed:", payment);
}
