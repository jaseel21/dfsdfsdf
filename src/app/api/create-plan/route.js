import Razorpay from "razorpay";
import connectDB from "../../../lib/db";
// import Subscription from "../../../models/AutoSubscription";
// import Donor from "../../../models/Donor"
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    await connectDB();
    const {  name, phoneNumber, amount, period, interval } = await req.json();

    if (!name || !phoneNumber || !amount || !period || !interval) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // let phone = "+91" + phoneNumber; 
    
    
    
  //   let donor = await Donor.findOne({ phone });
  //   if (!donor) {
  //         console.log("Creating new donor...");
  //         donor = await Donor.create({ name, phone,  period});
  //  } else {
  //         console.log("Donor already exists:", donor);
  //         return NextResponse.json({ exist: true });
  //   }

    console.log("Creating plan with:", { name, phoneNumber, amount, period, interval });
    const plan = await razorpay.plans.create({
      period,
      interval,
      item: { name: `${period} Donation Subscription`, amount: amount * 100, currency: "INR" },
    });
    console.log("Razorpay plan created:", plan);

    // const subscription = new Subscription({
    //   donorId:donor._id,
    //   planId: plan.id,
    //   name:donor.name,
    //   amount,
    //   district:district,
    //   panchayat:panchayat,
    //   period,
    //   phone:"+91"+phoneNumber,
    //   interval,
    //   status:"active",
    //   method:"auto",
    // });
    // await subscription.save();
    // console.log("Subscription saved to DB:", subscription);

    return NextResponse.json({ planId: plan.id });
  } catch (error) {
    console.error("Plan creation error:", {
      message: error.message,
      code: error.code,
      details: error.description || error,
    });
    return NextResponse.json(
      { error: "Plan creation failed", details: error.message || error.description },
      { status: 500 }
    );
  }
}