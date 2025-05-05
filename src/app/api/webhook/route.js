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

// Function to standardize phone numbers
const standardizePhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove any non-digit characters (spaces, dashes, etc.)
  const cleanedPhone = phone.replace(/\D/g, "");
  
  // If the phone number already includes a country code (starts with +)
  if (phone.startsWith("+")) {
    return phone; // Use as-is
  }
  
  // Assume Indian phone number (10 digits) and prepend +91
  if (cleanedPhone.length === 10) {
    return `+91${cleanedPhone}`;
  }
  
  // If the number is invalid, log and return null
  console.warn(`Invalid phone number format: ${phone}`);
  return null;
};

export async function POST(req) {
  try {
    await connectDB();
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);
    const signature = req.headers.get("x-razorpay-signature");

    console.log("Received webhook event:", event.event);

    if (!verifySignature(event, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      console.error("Invalid signature for webhook event:", event.event);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle subscription.charged event
    if (event.event === "subscription.charged") {
      const subscriptionId = event.payload.subscription.entity.id;
      const paymentId = event.payload.payment.entity.id;
      const amount = event.payload.payment.entity.amount / 100;

      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });
      if (!subscription || subscription.status !== "active") {
        return NextResponse.json({ received: true });
      }

      const standardizedPhone = standardizePhoneNumber(subscription.phone);
      if (!standardizedPhone) {
        console.error("Invalid phone number for subscription.charged:", subscription.phone);
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }

      const donation = new Donation({
        donorId: subscription.donorId,
        razorpaySubscriptionId: subscriptionId,
        name: subscription.name || "Anonymous",
        phone: standardizedPhone,
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
      console.log("Recurring donation recorded:", donation);

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          createdAt: new Date(),
          lastPaymentAt: new Date(),
          phone: standardizedPhone, // Update phone number in subscription
        },
        { new: true }
      );
      console.log("Subscription Updated:", updatedSubscription);

      // Twilio notification
      const fromNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
      const toNumber = standardizedPhone.startsWith("+")
        ? `whatsapp:${standardizedPhone}`
        : `whatsapp:+91${standardizedPhone}`;
      try {
        await twilioClient.messages.create({
          body: `Payment of ₹${amount} for your ${subscription.period} donation subscription received! Thank you for your support.`,
          from: fromNumber,
          to: toNumber,
        });
      } catch (twilioError) {
        console.error("Twilio error:", twilioError.message);
      }
    }

    // Handle payment.captured event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const amount = payment.amount / 100;

      // Check for duplicates
      const existingDonation = await Donation.findOne({ razorpayPaymentId: paymentId });
      if (existingDonation) {
        console.log("Duplicate donation found:", paymentId);
        return NextResponse.json({ received: true });
      }

      // Extract user data from notes
      const {
        fullName,
        phone,
        type,
        district,
        panchayat,
        emailAddress,
        message,
        campaignId,
        instituteId,
        boxId,
        period,
      } = payment.notes || {};

      console.log("Payment notes:", payment.notes);

      // Standardize phone number
      const standardizedPhone = standardizePhoneNumber(phone || payment.contact);
      if (!standardizedPhone && type === "Subscription") {
        console.error("Invalid phone number for payment.captured:", phone || payment.contact);
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }

      // Handle different payment types
      if (["General", "Yatheem", "Hafiz", "Building五、", "Box"].includes(type)) {
        const donation = new Donation({
          amount,
          type: type || "General",
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id || null,
          campaignId: campaignId || null,
          instituteId: instituteId || "null",
          boxId: boxId || "null",
          name: fullName || "null",
          phone: standardizedPhone || null,
          email: emailAddress || payment.email || null,
          district: district || null,
          panchayat: panchayat || null,
          message: message || null,
          status: "Completed",
          method: payment.method,
          createdAt: new Date(payment.created_at * 1000),
        });

        await donation.save();
        console.log("One-time donation recorded:", donation);

        // Optional Twilio notification for one-time donation
        if (standardizedPhone) {
          const toNumber = standardizedPhone.startsWith("+")
            ? `whatsapp:${standardizedPhone}`
            : `whatsapp:+91${standardizedPhone}`;
          try {
            await twilioClient.messages.create({
              body: `Thank you, ${fullName || "Donor"}, for your donation of ₹${amount}! Your support is greatly appreciated.`,
              from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
              to: toNumber,
            });
          } catch (twilioError) {
            console.error("Twilio error for one-time donation:", twilioError.message);
          }
        }
      } else if (["Sponsor-Hafiz", "Sponsor-Yatheem"].includes(type)) {
        const sponsor = new Sponsor({
          amount,
          type: type || "null",
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id || null,
          campaignId: campaignId || null,
          instituteId: instituteId || "null",
          boxId: boxId || "null",
          name: fullName || "null",
          phone: standardizedPhone || null,
          email: emailAddress || payment.email || null,
          district: district || null,
          panchayat: panchayat || null,
          period: period || "null",
          message: message || null,
          status: "Completed",
          method: payment.method,
          createdAt: new Date(payment.created_at * 1000),
        });

        await sponsor.save();
        console.log("Sponsor donation recorded:", sponsor);
      } else if (type === "Subscription") {
        const existingSdonation = await Sdonation.findOne({ razorpayPaymentId: paymentId });
        if (existingSdonation) {
          console.log("Duplicate Sdonation found:", paymentId);
          return NextResponse.json({ received: true });
        }

        // Create or find Donor
        let donor = await Donor.findOne({ phone: standardizedPhone });
        if (!donor) {
          console.log("Creating new donor for subscription...");
          donor = await Donor.create({
            name: fullName || "Anonymous",
            phone: standardizedPhone,
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
          phone: standardizedPhone,
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
          phone: standardizedPhone,
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

        // Twilio notification for Subscription
        if (standardizedPhone) {
          const toNumber = standardizedPhone.startsWith("+") ? `whatsapp:${standardizedPhone}` : `whatsapp:+91${standardizedPhone}`;
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
      }
    }

    // Handle payment.failed event
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const amount = payment.amount / 100;

      // Check for duplicates
      const existingDonation = await Donation.findOne({ razorpayPaymentId: paymentId });
      if (existingDonation) {
        return NextResponse.json({ received: true });
      }

      // Extract user data from notes
      const {
        fullName,
        phone,
        type,
        district,
        panchayat,
        emailAddress,
        message,
        campaignId,
        instituteId,
        boxId,
        period,
      } = payment.notes || {};

      // Standardize phone number
      const standardizedPhone = standardizePhoneNumber(phone || payment.contact);

      if (["General", "Yatheem", "Hafiz", "Building", "Box"].includes(type)) {
        const donation = new Donation({
          amount,
          type: type || "General",
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id || null,
          campaignId: campaignId || null,
          instituteId: instituteId || "null",
          boxId: boxId || "null",
          name: fullName || "null",
          phone: standardizedPhone || null,
          email: emailAddress || payment.email || null,
          district: district || null,
          panchayat: panchayat || null,
          message: message || null,
          status: "Failed",
          method: payment.method,
          createdAt: new Date(payment.created_at * 1000),
        });
        await donation.save();
        console.log("Failed donation recorded:", donation);
      } else if (["Sponsor-Hafiz", "Sponsor-Yatheem"].includes(type)) {
        const sponsor = new Sponsor({
          amount,
          type: type || "null",
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id || null,
          campaignId: campaignId || null,
          instituteId: instituteId || "null",
          boxId: boxId || "null",
          name: fullName || "null",
          phone: standardizedPhone || null,
          email: emailAddress || payment.email || null,
          district: district || null,
          panchayat: panchayat || null,
          period: period || "null",
          message: message || null,
          status: "Failed",
          method: payment.method,
          createdAt: new Date(payment.created_at * 1000),
        });
        await sponsor.save();
        console.log("Failed sponsor donation recorded:", sponsor);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}