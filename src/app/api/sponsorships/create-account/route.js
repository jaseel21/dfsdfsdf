import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Sponsor from "@/models/Sponsor";

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { phone, selectedAmount, type, period } = body;

    if (!phone || !selectedAmount || !type || !period) {
      return NextResponse.json(
        { error: "Missing required fields: phone, selectedAmount, type, period" },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    // Check if sponsor account already exists
    let sponsor = await Sponsor.findOne({ phone: formattedPhone, type });

    if (sponsor) {
      // Update selected amount if not set or different
      if (!sponsor.selectedAmount || sponsor.selectedAmount !== selectedAmount) {
        sponsor.selectedAmount = selectedAmount;
        await sponsor.save();
      }
      return NextResponse.json({ id: sponsor._id, existing: true }, { status: 200 });
    }

    // Create new sponsor account (pending payment)
    sponsor = new Sponsor({
      phone: formattedPhone,
      selectedAmount: selectedAmount,
      paidAmount: 0,
      type,
      period,
      status: "Pending",
      amount: 0, // Will be updated after payment
      name: null,
      email: null,
      district: "",
      panchayat: "",
      razorpayPaymentId: `PENDING-${Date.now()}`,
      razorpayOrderId: `PENDING-${Date.now()}`,
      userId: `sponsor-${Date.now()}`,
    });

    await sponsor.save();

    return NextResponse.json({ id: sponsor._id, existing: false }, { status: 201 });
  } catch (error) {
    console.error("Error creating sponsor account:", error);
    return NextResponse.json(
      { error: "Failed to create sponsor account", details: error.message },
      { status: 500 }
    );
  }
}

