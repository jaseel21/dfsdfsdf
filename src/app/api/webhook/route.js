import connectDB from "../../../lib/db";
import Donation from "../../../models/Donation";
import Subscription from "../../../models/Subscription";
import Sponsor from "@/models/Sponsor";
import Donor from "@/models/Donor";
import Sdonation from "@/models/Sdonation";
import { NextResponse } from "next/server";
import crypto from "crypto";

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

    console.log("Received webhook event:", event.event);

    if (!verifySignature(event, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      console.error("Invalid signature for event:", event.event);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const amount = payment.amount / 100;
      const { fullName, phone, type, district, panchayat, emailAddress, period } = payment.notes || {};

      console.log("Payment notes:", payment.notes);

      if (type === "Subscription") {
        console.log("Processing Subscription payment:", paymentId);

        const existingSdonation = await januari findOne({ razorpayPaymentId: paymentId });
        if (existingSdonation) {
          console.log("Duplicate Sdonation found:", paymentId);
          return NextResponse.json({ received: true });
        }

        // Create or find Donor
        let donor = await Donor.findOne({ phone });
        if (!donor) {
          console.log("Creating new donor for subscription...");
          donor = await Donor.create({
            name: fullName || "Anonymous",
            phone,
            email: emailAddress,
            period,
          });
        } else {
          console.log("Donor already exists:", donor);
        }

        // Create Subscription
        const subscription = await Subscription.create({
          donorId: donor._id,
          name: fullName || "Anonymous",
          phone,
          amount,
          period,
          email: emailAddress,
          district,
          panchayat,
          method: "manual",
          status: "active",
          lastPaymentAt: new Date(payment.created_at * 1000),
          type: type || "General",
        });
        console.log("Subscription created:", subscription);

        // Create Sdonation
        const newDonation = await Sdonation.create({
          donorId: donor._id,
          subscriptionId: subscription._id,
          phone,
          name: fullName || "Anonymous",
          amount,
          email: emailAddress,
          type: type || "General",
          period,
          district,
          panchayat,
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id,
          paymentStatus: "paid",
          paymentDate: new Date(payment.created_at * 1000),
        });
        console.log("Sdonation created:", newDonation);

        // Twilio notification
        if (phone) {
          const toNumber = phone.startsWith("+") ? `whatsapp:${phone}` : `whatsapp:+91${phone}`;
          try {
            await twilioClient.messages.create({
              body: `Thank you, ${fullName || "Donor"}, for your subscription donation of ₹${amount}! Your ${period} subscription is now active.`,
              from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
              to: toNumber,
            });
          } catch (twilioError) {
            console.error("Twilio error for subscription donation:", twilioError.message);
          }
        }
      } else {
        console.log("Skipping non-subscription payment:", type);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}