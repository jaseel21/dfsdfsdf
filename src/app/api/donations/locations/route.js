import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Donation from "../../../../models/Donation";

export async function GET() {
  try {
    await connectToDatabase();

    // Get unique districts and panchayats from donations
    const locationData = await Donation.aggregate([
      {
        $match: {
          status: "Completed",
          $or: [
            { district: { $exists: true, $ne: null, $ne: "" } },
            { panchayat: { $exists: true, $ne: null, $ne: "" } }
          ]
        }
      },
      {
        $group: {
          _id: {
            district: "$district",
            panchayat: "$panchayat"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.district",
          panchayats: {
            $push: {
              name: "$_id.panchayat",
              count: "$count"
            }
          },
          totalCount: { $sum: "$count" }
        }
      },
      {
        $sort: { totalCount: -1 }
      }
    ]);

    // Format the data
    const districts = locationData.map(district => ({
      name: district._id,
      count: district.totalCount,
      panchayats: district.panchayats
        .filter(p => p.name && p.name !== "")
        .sort((a, b) => b.count - a.count)
    })).filter(d => d.name && d.name !== "");

    return NextResponse.json({
      success: true,
      districts
    });

  } catch (error) {
    console.error("Error fetching location data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch location data" },
      { status: 500 }
    );
  }
}
