import connectDB from "../../../lib/db";
import Subscription from "../../../models/AutoSubscription";
import { NextResponse } from "next/server";
import Donor from "../../../models/Donor"
// import twilio from "twilio";

// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { razorpaySubscriptionId, planId, name, method = "auto", amount, period, district, panchayat, email, status = "active", phoneNumber, subscriptionStartDate } = body;

    if (!razorpaySubscriptionId || !planId || !amount || !period) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const standardizePhone = (p) => {
      if (!p) return null;
      const cleaned = String(p).replace(/\D/g, "");
      if (String(p).startsWith("+")) return p;
      if (cleaned.length === 10) return `+91${cleaned}`;
      return null;
    };

    const phone = standardizePhone(phoneNumber);
    if (!phone) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    let donor = await Donor.findOne({ phone });
    if (!donor) {
      donor = await Donor.create({ name: name || "Anonymous", phone, email, period });
    }

    const update = {
      donorId: donor._id,
      planId,
      razorpaySubscriptionId,
      name: name || donor.name || "Anonymous",
      amount,
      district: district || null,
      panchayat: panchayat || null,
      period,
      email: email || null,
      phone,
      status,
      method,
    };

    if (subscriptionStartDate) {
      update.subscriptionStartDate = new Date(subscriptionStartDate);
    }

    const subscription = await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId },
      { $set: update, $setOnInsert: { createdAt: new Date() } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: "Subscription activated", subscriptionId: subscription._id });
  } catch (error) {
    console.error("Update subscription status error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}