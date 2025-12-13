import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Donation from "../../../../models/Donation";

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: []
      });
    }

    // Search for donors matching the query
    const pipeline = [
      {
        $match: {
          status: "Completed",
          $or: [
            { name: { $regex: query, $options: "i" } },
            { phone: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } }
          ]
        }
      },
      {
        $group: {
          _id: "$phone",
          name: { $first: "$name" },
          email: { $first: "$email" },
          phone: { $first: "$phone" },
          district: { $first: "$district" },
          panchayat: { $first: "$panchayat" },
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
          lastDonation: { $max: "$createdAt" }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: limit
      }
    ];

    const suggestions = await Donation.aggregate(pipeline);

    const formattedSuggestions = suggestions.map(donor => ({
      phone: donor.phone,
      name: donor.name || "Anonymous",
      email: donor.email || "",
      district: donor.district || "Not specified",
      panchayat: donor.panchayat || "Not specified",
      totalAmount: donor.totalAmount,
      donationCount: donor.donationCount,
      lastDonation: donor.lastDonation,
      displayText: `${donor.name || "Anonymous"} (${donor.phone}) - ${donor.district}`,
      value: donor.phone
    }));

    return NextResponse.json({
      success: true,
      suggestions: formattedSuggestions
    });

  } catch (error) {
    console.error("Error searching donors:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search donors" },
      { status: 500 }
    );
  }
}
