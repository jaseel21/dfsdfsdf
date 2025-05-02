// --- /api/webhook/route.js ---

import connectDB from "../../../lib/db";
import Donation from "../../../models/Donation";
import Subscription from "../../../models/Subscription";
import { NextResponse } from "next/server";
import crypto from "crypto";
import twilioClient from "../../../lib/twilio"; // ensure you have a twilioClient configured

const verifySignature = (body, signature, secret) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(body));
  return hmac.digest("hex") === signature;
};

export async function POST(req) {
  try {
    await connectDB();
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);
    const signature = req.headers.get("x-razorpay-signature");

    if (!verifySignature(event, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.event === "subscription.charged") {
      const subscriptionId = event.payload.subscription.entity.id;
      const paymentId = event.payload.payment.entity.id;
      const amount = event.payload.payment.entity.amount / 100;

      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });
      if (!subscription || subscription.status !== "active") {
        return NextResponse.json({ received: true });
      }

      const donation = new Donation({
        donorId: subscription.donorId,
        razorpaySubscriptionId: subscriptionId,
        name: subscription.name || "Anonymous",
        phone: subscription.phone,
        amount: subscription.amount,
        period: subscription.period,
        district: subscription.district,
        panchayat: subscription.panchayat,
        planId: subscription.planId,
        email: subscription.email,
        razorpayPaymentId: paymentId,
        status: "Completed",
        method: "auto",
        paymentStatus: "paid",
        subscriptionId: subscription._id,
        type: subscription.type || "General",
      });
      await donation.save();

      await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          createdAt: new Date(),
          lastPaymentAt: new Date(),
        },
        { new: true }
      );

      const fromNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
      const toNumber = subscription.phone.startsWith("+")
        ? `whatsapp:${subscription.phone}`
        : `whatsapp:+91${subscription.phone}`;
      try {
        await twilioClient.messages.create({
          body: `Payment of ₹${amount} for your ${subscription.period} donation subscription received! Thank you for your support.`,
          from: fromNumber,
          to: toNumber,
        });
      } catch (twilioError) {
        console.error("Twilio error:", twilioError.message);
      }
      return NextResponse.json({ received: true });
    }

    if (["payment.captured", "payment.authorized", "payment.failed"].includes(event.event)) {
      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const amount = payment.amount / 100;
      const statusMap = {
        "payment.captured": "Completed",
        "payment.authorized": "Pending",
        "payment.failed": "Failed",
      };
      const donationStatus = statusMap[event.event] || "Pending";

      const existingDonation = await Donation.findOne({ razorpayPaymentId: paymentId });
      if (existingDonation) {
        return NextResponse.json({ received: true });
      }

      const donation = new Donation({
        amount,
        type: payment.notes?.donationType || "General",
        boxId: payment.notes?.boxId || null,
        campaignId: payment.notes?.campaignId || null,
        instituteId: payment.notes?.instituteId || null,
        district: payment.notes?.district || null,
        panchayat: payment.notes?.panchayat || null,
        email: payment.notes?.email || payment.email || null,
        name: payment.notes?.fullName || "Anonymous",
        phone: payment.notes?.phoneNumber || payment.contact || null,
        status: donationStatus,
        razorpayPaymentId: paymentId,
        razorpayOrderId: payment.order_id || null,
        razorpaySignature: payment.signature || null,
        createdAt: new Date(payment.created_at * 1000),
      });

      await donation.save();
      console.log(`${event.event} donation recorded:`, donation);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
