import Razorpay from "razorpay";
import connectDB from "../../../lib/db";
import { NextResponse } from "next/server";
import twilio from "twilio";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req) {
  try {
    await connectDB();
    const { planId,period ,phone,amount} = await req.json();


    if ( !planId) {
      return NextResponse.json({ error: "Missing userId or planId" }, { status: 400 });
    }

    // const subscription = await Subscription.findOne({ planId });
    // if (!subscription) {
    //   return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    // }

    const totalCount = { weekly: 52, monthly: 12, yearly: 1 }[period] || 12;
    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount,
    });

    // subscription.razorpaySubscriptionId = razorpaySubscription.id;
    // subscription.status = "created";
    // subscription.subscriptionId=subscription._id;
    // await subscription.save();

    const fromNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
    // const toNumber = subscription.phoneNumber.startsWith("+")
      // ? `whatsapp:${subscription.phoneNumber}`
      const toNumber =  `whatsapp:+91${phone}`;
    try {
      await twilioClient.messages.create({
        body: `Your ${period} donation subscription is created! Amount: ₹${amount}. Please complete the initial payment.`,
        from: fromNumber,
        to: toNumber,
      });
    } catch (twilioError) {
      console.error("Twilio error:", twilioError.message);
    }

    return NextResponse.json({ subscriptionId: razorpaySubscription.id });
  } catch (error) {
    console.error("Subscription creation error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}