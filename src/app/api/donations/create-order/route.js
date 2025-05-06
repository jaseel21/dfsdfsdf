import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const {
      amount,
      campaignId,
      type,
      name,
      phone,
      email,
      district,
      panchayat,
      message,
      boxId,
      instituteId,
      razorpaySubscriptionId,
      planId,
      period,
    } = await req.json();

    console.log(email,name,phone,"eeeeeeeeeeeeeeeeemail");
    

    // Validate amount (required in all cases)
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Validate donationType (required)
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Invalid donation type" }, { status: 400 });
    }

    // Optional validations
    if (campaignId && typeof campaignId !== "string") {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }
    if (boxId && typeof boxId !== "string") {
      return NextResponse.json({ error: "Invalid box ID" }, { status: 400 });
    }
    if (instituteId && typeof instituteId !== "string") {
      return NextResponse.json({ error: "Invalid institute ID" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    // if (phone && !/^[0-9]{10}$/.test(phone)) {
    //   return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    // }



    const orderOptions = {
      amount, // Already in paise from frontend
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        type,
        fullName: name || "Anonymous",
        phone,
        emailAddress:email,
        district,
        panchayat,
        message,
        boxId,
        instituteId,
        campaignId,
        razorpaySubscriptionId,
        planId,
        period:period || "null"
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json(
      {
        orderId: order.id,
        campaignId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}