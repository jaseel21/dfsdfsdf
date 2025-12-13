import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Donation from "@/models/Donation";

export async function GET() {
  try {
    await dbConnect();

    // Get all completed donations (remove createdAt filter)
    const donations = await Donation.find({ status: "Completed" }).sort({ createdAt: 1 });

    // Calculate date 12 months ago
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    // Group donations by month, only include those within last 12 months
    const monthlyData: { [key: string]: number } = {};

    donations.forEach((donation) => {
      // Convert createdAt to Date object if it's a string
      const date =
        typeof donation.createdAt === "string"
          ? new Date(donation.createdAt)
          : donation.createdAt instanceof Date
          ? donation.createdAt
          : null;

      if (!date || date < lastYear) return; // Skip if invalid or older than 12 months

      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear] += Number(donation.amount) || 0;
    });

    // Generate last 7 months including current month
    const months = [];
    const amounts = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });

      months.push(monthName);
      amounts.push(monthlyData[monthYear] || 0);
    }

    return NextResponse.json({
      labels: months,
      data: amounts,
      total: amounts.reduce((sum, amount) => sum + amount, 0)
    });

  } catch (error) {
    console.error("Error fetching monthly donation data:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly donation data" },
      { status: 500 }
    );
  }
}
