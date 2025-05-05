import connectDB from "../../../lib/db";
import Donation from "../../../models/Donation";
import Subscription from "../../../models/Subscription";
import Sponsor from "@/models/Sponsor";
import { NextResponse } from "next/server";
import  Donor from "@/models/Donor"
import Sdonation from "@/models/Sdonation";
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

    if (!verifySignature(event, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle subscription.charged event (unchanged)
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
      console.log("Recurring donation recorded:", donation);

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          createdAt: new Date(),
          lastPaymentAt: new Date(),
        },
        { new: true }
      );
      console.log("Subscription Updated:", updatedSubscription);

      // Twilio notification
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
    }

    // Handle payment.captured event for one-time payments
    if (event.event === "payment.captured") {
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
        phone: rawPhone = payment.contact || null,
        type,
        district = null,
        panchayat = null,
        emailAddress = payment.email || null,
        message = null,
        campaignId = null,
        instituteId = null,
        boxId = null,
        period = null,
      } = payment.notes || {};
    
      let phone = rawPhone;
    
      if (phone) {
        // If phone already has a country code, use it as-is for Twilio
        if (phone.startsWith("+")) {
          // Strip country code for storage (assuming +91 for India)
          if (phone.startsWith("+91") && phone.length === 13) {
            phone = phone.slice(3); // e.g., +919876543210 -> 9876543210
          }
        } else {
          // Assume 10-digit Indian number and prepend +91 for Twilio
          if (/^[0-9]{10}$/.test(phone)) {
          } else {
            console.warn("Invalid phone number format:", phone);
            phone = null; // Fallback for invalid numbers
          }
        }
      } else {
        console.warn("No phone number provided in payment.notes or payment.contact");
        phone = null;
       
      }
    

      if(type==="General" || "Yatheem" || "Hafiz" || "Bullding" || "Box"){
        const donation = new Donation({
          amount,
          type: type || "General",
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id || null,
          campaignId: campaignId || null,
          instituteId:instituteId || "null",
          boxId:boxId || "null",
          name: fullName || "null",
          phone: phone || payment.contact || null,
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
        if (phoneNumber) {
          const toNumber = phoneNumber.startsWith("+")
            ? `whatsapp:${phoneNumber}`
            : `whatsapp:+91${phoneNumber}`;
          try {
            await twilioClient.messages.create({
              body: `Thank you, ${fullName || "Donor"}, for your donation of ₹${amount}! Your support is greatly appreciated.`,
              from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
              to: toNumber,
            });
          } catch (twilioError) {
            console.error("Twilio error for one-time donation:", twilioError.message);
          }
      }else  if(type==="Sponsor-Hafiz" || "Sponsor-Yatheem"){
        const sponsor = new Sponsor({
          amount,
          type: type || "null",
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id || null,
          campaignId: campaignId || null,
          instituteId:instituteId || "null",
          boxId:boxId || "null",
          name: fullName || "null",
          phone: phone || payment.contact || null,
          email: emailAddress || payment.email || null,
          district: district || null,
          panchayat: panchayat || null,
          period:period || "null",
          message: message || null,
          status: "Completed",
          method: payment.method,
          createdAt: new Date(payment.created_at * 1000),
        });
  
        await sponsor.save();
        console.log("One-time donation recorded:", Sponsor);
      }else if(type==="Subscription"){
         let donor = await Donor.findOne({ phone });
         console.log("webhook exicuted");
         
            if (!donor) {
              console.log("Creating new donor...");
              donor = await Donor.create({ name:fullName, phone,email:emailAddress, period });
            } else {
              console.log("Donor already exists:", donor);
              return NextResponse.json({ exist: true });
            }

            const subscription = await Subscription.create({
                  donorId: donor._id,
                  name:fullName,
                  phone,
                  amount,
                  period,
                  email:emailAddress,
                  district,
                  panchayat,
                  method:"manual",
                  status:"active"
                });

                const newDonation = await Sdonation.create({
                      donorId: donor._id,
                      subscriptionId: subscription._id,
                      phone,
                      name:fullName,
                      amount,
                      email:emailAddress,
                      type: type || "General", // Use provided type or default
                      period,
                      district,
                      panchayat,
                      razorpayPaymentId,
                      razorpayOrderId,
                      razorpaySignature,
                    });

                    console.log("Donation Created:", newDonation);

      }

     
      }
    }else if(event.event === "payment.failed"){
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
      } = payment.notes || {};

      if(type==="General" || "Yatheem" || "Hafiz" || "Bullding" || "Box"){

        const donation = new Donation({
          amount,
          type: type || "General",
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id || null,
          campaignId: campaignId || null,
          instituteId:instituteId ||"null",
          boxId:boxId || "null",
          name: fullName || "null",
          phone: phone || payment.contact || null,
          email: emailAddress || payment.email || null,
          district: district || null,
          panchayat: panchayat || null,
          message: message || null,
          status: "Failed",
          method: payment.method,
          createdAt: new Date(payment.created_at * 1000),
        });
        await donation.save();

      }else if(type==="Sponsor-Hafiz" || "Sponsor-Yatheem"){
        const sponsor = new Sponsor({
          amount,
          type: type || "null",
          razorpayPaymentId: paymentId,
          razorpayOrderId: payment.order_id || null,
          campaignId: campaignId || null,
          instituteId:instituteId || "null",
          boxId:boxId || "null",
          name: fullName || "null",
          phone: phone || payment.contact || null,
          email: emailAddress || payment.email || null,
          district: district || null,
          panchayat: panchayat || null,
          period:period || "null",
          message: message || null,
          status: "Failed",
          method: payment.method,
          createdAt: new Date(payment.created_at * 1000),
        });
  
        await sponsor.save();
      }


      console.log("One-time donation recorded:", donation);

      // Optional Twilio notification for one-time donation
      if (phoneNumber) {
        const toNumber = phoneNumber.startsWith("+")
          ? `whatsapp:${phoneNumber}`
          : `whatsapp:+91${phoneNumber}`;
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
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}