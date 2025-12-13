import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Donation from "../../../../models/Donation";

export async function GET() {
  try {
    console.log("Debug endpoint called");
    
    // Connect to database
    await connectToDatabase();
    console.log("Database connected");

    // Get total count of donations
    const totalCount = await Donation.countDocuments();
    console.log("Total donations in DB:", totalCount);

    // Get count of completed donations
    const completedCount = await Donation.countDocuments({ status: "Completed" });
    console.log("Completed donations:", completedCount);

    // Get a sample of donations to check structure
    const sampleDonations = await Donation.find().limit(3).lean();
    console.log("Sample donations:", sampleDonations);

    // Check if there are donations with phone numbers
    const withPhone = await Donation.countDocuments({ 
      status: "Completed",
      phone: { $exists: true, $ne: null, $ne: "" }
    });
    console.log("Completed donations with phone:", withPhone);

    // Check if there are donations with email
    const withEmail = await Donation.countDocuments({ 
      status: "Completed",
      email: { $exists: true, $ne: null, $ne: "" }
    });
    console.log("Completed donations with email:", withEmail);

    // Simple aggregation test
    const simpleAgg = await Donation.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    console.log("Simple aggregation result:", simpleAgg);

    return NextResponse.json({
      success: true,
      debug: {
        totalCount,
        completedCount,
        withPhone,
        withEmail,
        sampleDonations: sampleDonations.map(d => ({
          id: d._id,
          amount: d.amount,
          status: d.status,
          phone: d.phone,
          email: d.email,
          name: d.name,
          createdAt: d.createdAt
        })),
        simpleAggregation: simpleAgg[0] || { total: 0, count: 0 }
      }
    });

  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
