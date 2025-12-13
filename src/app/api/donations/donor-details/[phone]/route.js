import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/db";
import Donation from "../../../../../models/Donation";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    const { phone } = params;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Get all donations for this phone number
    const donations = await Donation.find({
      phone: phone,
      status: "Completed"
    }).sort({ createdAt: -1 }).lean();

    if (donations.length === 0) {
      return NextResponse.json(
        { success: false, message: "No donations found for this phone number" },
        { status: 404 }
      );
    }

    // Calculate donor statistics
    const totalAmount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const donationCount = donations.length;
    const averageAmount = Math.round(totalAmount / donationCount);
    const firstDonation = donations[donations.length - 1].createdAt;
    const lastDonation = donations[0].createdAt;

    // Group donations by type
    const donationsByType = donations.reduce((acc, donation) => {
      const type = donation.type || "General";
      if (!acc[type]) {
        acc[type] = { count: 0, total: 0 };
      }
      acc[type].count++;
      acc[type].total += donation.amount || 0;
      return acc;
    }, {});

    // Group donations by month for trend analysis
    const donationsByMonth = donations.reduce((acc, donation) => {
      const monthKey = new Date(donation.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, total: 0 };
      }
      acc[monthKey].count++;
      acc[monthKey].total += donation.amount || 0;
      return acc;
    }, {});

    // Calculate days between donations
    const daysBetweenDonations = [];
    for (let i = 1; i < donations.length; i++) {
      const diff = new Date(donations[i-1].createdAt) - new Date(donations[i].createdAt);
      daysBetweenDonations.push(Math.round(diff / (1000 * 60 * 60 * 24)));
    }

    const avgDaysBetweenDonations = daysBetweenDonations.length > 0 
      ? Math.round(daysBetweenDonations.reduce((a, b) => a + b, 0) / daysBetweenDonations.length)
      : 0;

    // Build donor profile
    const donorProfile = {
      phone: phone,
      name: donations[0].name || "Anonymous",
      email: donations[0].email || "",
      district: donations[0].district || "Not specified",
      panchayat: donations[0].panchayat || "Not specified",
      
      // Statistics
      totalAmount,
      donationCount,
      averageAmount,
      firstDonation,
      lastDonation,
      daysSinceFirstDonation: Math.round((new Date() - new Date(firstDonation)) / (1000 * 60 * 60 * 24)),
      avgDaysBetweenDonations,
      
      // Breakdown
      donationsByType,
      donationsByMonth,
      
      // Recent donations (limited to 20)
      recentDonations: donations.slice(0, 20).map(donation => ({
        id: donation._id,
        amount: donation.amount,
        type: donation.type,
        date: donation.createdAt,
        status: donation.status,
        razorpayPaymentId: donation.razorpayPaymentId
      }))
    };

    return NextResponse.json({
      success: true,
      donor: donorProfile
    });

  } catch (error) {
    console.error("Error fetching donor details:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch donor details" },
      { status: 500 }
    );
  }
}
