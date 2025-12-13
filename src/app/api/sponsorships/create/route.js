// src/app/api/sponsor/create/route.js (assumed path)
import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Sponsor from "../../../../models/Sponsor";
import Yatheem from "../../../../models/Yatheem";

import Donation from "../../../../models/Donation";
import Razorpay from "razorpay";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();


    const {
      amount,
      name,
      phone,
      type,
      email,
      period,
      district,
      panchayat,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      selectedAmount, // For existing sponsors
      paymentType = "main", // "main" or "extra"
    } = body;

    // Validate required fields
    if (!amount || !type || !razorpayPaymentId) {
      console.log("Missing required fields:", { amount, type, razorpayPaymentId });
      return NextResponse.json(
        { error: "Missing required fields: amount, type, razorpayPaymentId are required" },
        { status: 400 }
      );
    }

    // Validate amount is a number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      console.log("Invalid amount:", amount);
      return NextResponse.json({ error: "Amount must be a number" }, { status: 400 });
    }

    // Fetch payment details from Razorpay API
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    console.log("Razorpay Payment Details:", payment);

    // Check if payment is captured
    if (payment.status !== "captured") {
      console.log("Payment not captured:", payment.status);
      return NextResponse.json(
        { error: "Payment not captured or failed", paymentStatus: payment.status },
        { status: 400 }
      );
    }

    // Verify amount matches (Razorpay returns amount in paise)
    const paidAmount = payment.amount / 100; // Convert paise to INR
    if (paidAmount !== parsedAmount) {
      console.log("Amount mismatch:", { expected: parsedAmount, received: paidAmount });
      return NextResponse.json(
        { error: "Amount mismatch", expected: parsedAmount, received: paidAmount },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = phone?.startsWith("+") ? phone : "+91" + phone;

    // Check if sponsor account already exists
    let sponsor = await Sponsor.findOne({ phone: formattedPhone, type });

    if (sponsor) {
      // Update existing sponsor account
      sponsor.name = name || sponsor.name;
      sponsor.email = email || sponsor.email;
      sponsor.district = district || sponsor.district || "";
      sponsor.panchayat = panchayat || sponsor.panchayat || "";

      // Removed razorpay fields from Sponsor model

      // Update payment amounts
      // sponsor.amount = parsedAmount; // Removed from model
      sponsor.paidAmount = (sponsor.paidAmount || 0) + parsedAmount;

      // Update selectedAmount if provided (for first payment)
      if (selectedAmount) {
        sponsor.selectedAmount = selectedAmount;
      }

      // Update status based on payment
      if (sponsor.selectedAmount && sponsor.paidAmount >= sponsor.selectedAmount) {
        sponsor.status = "Completed";
      } else if (sponsor.paidAmount > 0) {
        sponsor.status = "Partial";
      } else {
        sponsor.status = "Pending";
      }

      // Update method
      sponsor.method = (sponsor.paidAmount >= sponsor.selectedAmount) ? "Complete" : "Split";

      sponsor.updatedAt = new Date();
      // sponsor.paymentDate = new Date(); // Removed from model
      await sponsor.save();

      // Create Donation record
      const donationRecord = new Donation({
        amount: parsedAmount,
        type: type,
        sponsorId: sponsor._id,
        name: name || sponsor.name,
        phone: formattedPhone,
        email: email || sponsor.email,
        district: district || sponsor.district,
        panchayat: panchayat || sponsor.panchayat,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        status: "Completed",
        createdAt: new Date(),
      });
      await donationRecord.save();
      console.log("💳 Donation record created:", donationRecord._id);

      // Auto-assign yatheem if type is Sponsor-Yatheem and no yatheem assigned yet
      // Only auto-assign when payment is completed (status is Completed or Partial with payment)
      if (type === "Sponsor-Yatheem" && !sponsor.yatheemId && sponsor.status !== "Pending") {
        const unassignedYatheem = await Yatheem.findOne({
          $or: [
            { sponsorId: { $exists: false } },
            { sponsorId: null },
            { sponsorId: { $eq: null } }
          ],
          status: "Active"
        }).sort({ createdAt: 1 }); // Assign oldest unassigned yatheem first

        if (unassignedYatheem) {
          sponsor.yatheemId = unassignedYatheem._id;
          unassignedYatheem.sponsorId = sponsor._id;
          await sponsor.save();
          await unassignedYatheem.save();
          console.log("✅ Auto-assigned yatheem:", unassignedYatheem._id, "to sponsor:", sponsor._id);
        } else {
          console.log("⚠️ No unassigned yatheem available for auto-assignment");
        }
      }
      console.log("🎉 Sponsor updated:", sponsor._id);

      return NextResponse.json({ id: sponsor._id, updated: true }, { status: 200 });
    }

    // Create new sponsor record
    const donation = new Sponsor({
      // amount: parsedAmount, // Removed from model
      paidAmount: parsedAmount,
      selectedAmount: selectedAmount || parsedAmount, // Use provided selectedAmount or default to paid amount
      method: (selectedAmount && parsedAmount >= selectedAmount) ? "Complete" : "Split",
      name,
      phone: formattedPhone,
      type,
      period,
      email,
      district: district || "",
      panchayat: panchayat || "",
      // razorpayPaymentId, // Removed from model
      // razorpayOrderId, // Removed from model
      // razorpaySignature, // Removed from model
      status: selectedAmount && parsedAmount >= selectedAmount ? "Completed" : "Partial",
      updatedAt: new Date(),
    });

    await donation.save();
    console.log("🎉 Sponsor saved:", donation._id);

    // Create Donation record
    const donationRecord = new Donation({
      amount: parsedAmount,
      type: type,
      sponsorId: donation._id, // donation variable here is the Sponsor document
      name: name,
      phone: formattedPhone,
      email: email,
      district: district,
      panchayat: panchayat,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      status: "Completed",
      createdAt: new Date(),
    });
    await donationRecord.save();
    console.log("💳 Donation record created:", donationRecord._id);

    // Auto-assign yatheem if type is Sponsor-Yatheem (only for completed payments)
    if (type === "Sponsor-Yatheem") {
      const unassignedYatheem = await Yatheem.findOne({
        $or: [
          { sponsorId: { $exists: false } },
          { sponsorId: null },
          { sponsorId: { $eq: null } }
        ],
        status: "Active"
      }).sort({ createdAt: 1 }); // Assign oldest unassigned yatheem first

      if (unassignedYatheem) {
        donation.yatheemId = unassignedYatheem._id;
        unassignedYatheem.sponsorId = donation._id;
        await donation.save();
        await unassignedYatheem.save();
        console.log("✅ Auto-assigned yatheem:", unassignedYatheem._id, "to sponsor:", donation._id);
      } else {
        console.log("⚠️ No unassigned yatheem available for auto-assignment");
      }
    }

    return NextResponse.json({ id: donation._id, updated: false }, { status: 201 });
  } catch (error) {
    console.error("Error saving donation:", error);
    return NextResponse.json(
      { error: "Failed to save donation", details: error.message },
      { status: 500 }
    );
  }
}