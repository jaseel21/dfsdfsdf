import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Donation from "../../../../models/Donation";

export async function GET() {
  try {
    console.log("Testing basic donation query...");
    await connectToDatabase();
    console.log("Database connected successfully");

    // Simple count query first
    const totalDonations = await Donation.countDocuments();
    console.log("Total donations in database:", totalDonations);

    const completedDonations = await Donation.countDocuments({ status: "Completed" });
    console.log("Completed donations:", completedDonations);

    // Get a sample of donations to check structure
    const sampleDonations = await Donation.find().limit(5).lean();
    console.log("Sample donation structure:", sampleDonations[0]);

    // Get donations with phone numbers
    const donationsWithPhone = await Donation.countDocuments({ 
      phone: { $exists: true, $ne: null, $ne: "" } 
    });
    console.log("Donations with phone numbers:", donationsWithPhone);

    return NextResponse.json({
      success: true,
      totalDonations,
      completedDonations,
      donationsWithPhone,
      sampleDonation: sampleDonations[0] || null
    });

  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Test failed", error: error.message },
      { status: 500 }
    );
  }
}
