import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Sponsor from "@/models/Sponsor";
import Yatheem from "@/models/Yatheem";
import YatheemExpense from "@/models/YatheemExpense";
import Donation from "@/models/Donation";

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const type = searchParams.get("type"); // Optional: filter by type

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    // Find sponsor by phone (and type if provided)
    const query = { phone: formattedPhone };
    if (type) {
      query.type = type;
    }
    const sponsor = await Sponsor.findOne(query).lean();

    if (!sponsor) {
      return NextResponse.json(
        { error: "Sponsor account not found" },
        { status: 404 }
      );
    }

    // Get assigned yatheem if exists
    let yatheemData = null;
    if (sponsor.yatheemId) {
      const yatheem = await Yatheem.findById(sponsor.yatheemId).lean();

      if (yatheem) {
        // Get all expenses for this yatheem
        const expenses = await YatheemExpense.find({ yatheemId: sponsor.yatheemId })
          .sort({ createdAt: -1 })
          .lean();

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        yatheemData = {
          _id: yatheem._id.toString(),
          name: yatheem.name,
          phone: yatheem.phone,
          place: yatheem.place,
          class: yatheem.class,
          school: yatheem.school,
          totalExpenses,
          expenses: expenses.map(exp => ({
            _id: exp._id.toString(),
            need: exp.need,
            amount: exp.amount,
            customFields: exp.customFields || [],
            createdAt: exp.createdAt,
          })),
        };
      }
    }

    // Get all payment history for this sponsor (from Donations)
    const donations = await Donation.find({ sponsorId: sponsor._id })
      .sort({ createdAt: -1 })
      .lean();

    const paymentHistory = donations.map(donation => ({
      _id: donation._id.toString(),
      amount: donation.amount,
      razorpayPaymentId: donation.razorpayPaymentId,
      razorpayOrderId: donation.razorpayOrderId,
      paymentDate: donation.createdAt, // Use createdAt as paymentDate
      status: donation.status === "Completed" ? "success" : donation.status, // Map status if needed
      type: donation.type,
    }));

    // Return sponsor data with yatheem info and payment history
    return NextResponse.json({
      _id: sponsor._id.toString(),
      name: sponsor.name || null,
      phone: sponsor.phone,
      email: sponsor.email || null,
      district: sponsor.district || null,
      panchayat: sponsor.panchayat || null,
      selectedAmount: sponsor.selectedAmount || sponsor.amount || 0,
      paidAmount: sponsor.paidAmount || sponsor.amount || 0,
      type: sponsor.type,
      method: sponsor.method,
      period: sponsor.period,
      status: sponsor.status,
      createdAt: sponsor.createdAt,
      yatheem: yatheemData,
      paymentHistory,
    });
  } catch (error) {
    console.error("Error fetching sponsor dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsor dashboard", details: error.message },
      { status: 500 }
    );
  }
}

