import connectDB from "../../../lib/db";
import Donation from "../../../models/Donation";
import Subscription from "../../../models/Subscription";
import Sponsor from "@/models/Sponsor";
import Donor from "@/models/Donor";
import Sdonation from "@/models/Sdonation";
import { NextResponse } from "next/server";
import crypto from "crypto";
import twilio from "twilio";

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const verifySignature = (rawBody, signature, secret) => {
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return false;
  }
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const computedSignature = hmac.digest("hex");
  console.log("Signature Verification:", {
    received: signature,
    computed: computedSignature,
  });
  return computedSignature === signature;
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
    // Validate environment variables
    const requiredEnvVars = [
      "RAZORPAY_WEBHOOK_SECRET",
      "API_BASE_URL",
      "TWILIO_PHONE_NUMBER",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
    ];
    const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      console.error("Missing environment variables:", missingEnvVars.join(", "));
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Connect to database
    await connectDB();

    // Get raw body and headers
    const rawBody = await req.text();
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse webhook body:", parseError.message);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const signature = req.headers.get("x-razorpay-signature");

    // Log webhook details
    console.log("Received Webhook:", {
      event: event.event,
      payload: JSON.stringify(event.payload || {}, null, 2),
      signature,
    });

    // Verify signature
    if (!verifySignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      console.error("Invalid signature for webhook event:", event.event);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.event === "subscription.activated") {
      try {
        console.log("Processing subscription.activated...");

        // Log webhook event to database
        await connectDB.collection("webhookLogs").insertOne({
          message: "Webhook triggered",
          event: event.event,
          timestamp: new Date(),
        });

        // Safely access subscription data
        const subscriptionData = event.payload?.subscription?.entity || {};
        if (!subscriptionData.id) {
          console.error("Missing subscription ID in payload");
          return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
        }

        const subscriptionId = subscriptionData.id;
        const notes = subscriptionData.notes || {};
        const startAt = subscriptionData.start_at || null;

        // Extract fields with defaults
        const fullName = notes.name || "Anonymous";
        const standardizedPhone = standardizePhoneNumber(notes.phoneNumber || "");
        const payment = subscriptionData.latest_invoice?.payment || {};
        const paymentId = payment.id || "";
        const subscriptionStartDate = startAt ? new Date(startAt * 1000).toISOString() : null;

        const subscriptionDetails = {
          razorpaySubscriptionId: subscriptionId,
          name: fullName,
          amount: notes.amount || 0,
          phoneNumber: standardizedPhone || "",
          district: notes.district || "",
          type: notes.type || "General",
          method: "auto",
          planId: notes.planId || "",
          email: notes.emailAddress || payment.email || "",
          panchayat: notes.panchayat || "",
          period: notes.period || "",
          razorpayOrderId: payment.order_id || "",
          razorpay_payment_id: paymentId,
          subscriptionStartDate,
          status: "active",
        };

        console.log("Subscription Details:", JSON.stringify(subscriptionDetails, null, 2));

        // Call API to update subscription status
        try {
          const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/update-subscription-status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
            },
            body: JSON.stringify(subscriptionDetails),
          });

          const apiData = await apiResponse.json();
          if (!apiResponse.ok) {
            console.error("Failed to update subscription status:", apiData.error || "Unknown error");
          } else {
            console.log("Subscription status updated successfully:", apiData);
          }
        } catch (apiError) {
          console.error("Error calling /api/update-subscription-status:", apiError.message);
        }
      } catch (subError) {
        console.error("Error in subscription.activated handler:", subError.message, subError.stack);
        return NextResponse.json({ error: "Failed to process subscription activation" }, { status: 500 });
      }
    }

    // Handle subscription.charged event
    if (event.event === "subscription.charged") {
      const subscriptionId = event.payload?.subscription?.entity?.id;
      const paymentId = event.payload?.payment?.entity?.id;
      const amount = event.payload?.payment?.entity?.amount / 100;

      if (!subscriptionId || !paymentId) {
        console.error("Missing subscriptionId or paymentId in subscription.charged event");
        return NextResponse.json({ received: true });
      }

      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });
      if (!subscription || subscription.status !== "active") {
        console.log("Subscription not found or inactive:", subscriptionId);
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
          phone: standardizedPhone,
        },
        { new: true }
      );
      console.log("Subscription Updated:", updatedSubscription);

      // Twilio notification
      if (twilioClient && standardizedPhone) {
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
    }

    // Handle payment.captured event
    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity || {};
      const paymentId = payment.id;
      const amount = payment.amount / 100;

      if (!paymentId) {
        console.error("Missing paymentId in payment.captured event");
        return NextResponse.json({ received: true });
      }

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
          status: "Completed",
          method: payment.method,
          createdAt: new Date(payment.created_at * 1000),
        });

        await donation.save();
        console.log("One-time donation recorded:", donation);

        // Optional Twilio notification for one-time donation
        if (twilioClient && standardizedPhone) {
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
        console.log("Completed sponsor donation recorded:", sponsor);
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
        if (twilioClient && standardizedPhone) {
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
      } else if (type === "Subscription-auto") {
        console.log("Processing Subscription-auto payment:", paymentId);

        // Prepare payload for /api/update-subscription-status
        const subscriptionData = {
          razorpaySubscriptionId: paymentId,
          name: fullName || "Anonymous",
          amount,
          phoneNumber: standardizedPhone,
          district: district || "",
          type: type || "General",
          method: "auto",
          planId: notes.planId || "",
          email: emailAddress || payment.email || "",
          panchayat: panchayat || "",
          period: period || "",
          razorpayOrderId: payment.order_id || "",
          razorpay_payment_id: paymentId,
          status: "active",
        };

        // Make API call to /api/update-subscription-status
        try {
          const apiResponse = await fetch(`${process.env.API_BASE_URL}/api/update-subscription-status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
            },
            body: JSON.stringify(subscriptionData),
          });

          const apiData = await apiResponse.json();
          if (!apiResponse.ok) {
            console.error("Failed to update subscription status:", apiData.error || "Unknown error");
          } else {
            console.log("Subscription status updated successfully:", apiData);
          }
        } catch (apiError) {
          console.error("Error calling /api/update-subscription-status:", apiError.message);
        }

        // Optional Twilio notification for Subscription-auto
        if (twilioClient && standardizedPhone) {
          const toNumber = standardizedPhone.startsWith("+") ? `whatsapp:${standardizedPhone}` : `whatsapp:+91${standardizedPhone}`;
          try {
            await twilioClient.messages.create({
              body: `Thank you, ${fullName || "Donor"}, for your auto subscription donation of ₹${amount}! Your ${period} subscription is now active.`,
              from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
              to: toNumber,
            });
          } catch (twilioError) {
            console.error("Twilio error for Subscription-auto donation:", twilioError.message);
          }
        }
      }
    }

    // Handle payment.failed event
    if (event.event === "payment.failed") {
      const payment = event.payload?.payment?.entity || {};
      const paymentId = payment.id;
      const amount = payment.amount / 100;

      if (!paymentId) {
        console.error("Missing paymentId in payment.failed event");
        return NextResponse.json({ received: true });
      }

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
    console.error("Webhook error:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}