import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Donation from "@/models/Donation";

export async function GET() {
  try {
    await dbConnect();

    // Get donations from the last 12 months for trend analysis
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const donations = await Donation.find({
      status: "Completed",
      createdAt: { $gte: twelveMonthsAgo }
    }).sort({ createdAt: 1 });

    // Group by week for more detailed trend
    const weeklyData: { [key: string]: { amount: number, count: number } } = {};
    
    donations.forEach((donation) => {
      const date = new Date(donation.createdAt);
      // Get the start of the week (Sunday)
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const weekKey = startOfWeek.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { amount: 0, count: 0 };
      }
      weeklyData[weekKey].amount += Number(donation.amount) || 0;
      weeklyData[weekKey].count += 1;
    });

    // Get last 8 weeks of data
    const weeks = [];
    const amounts = [];
    const counts = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + (i * 7)));
      const weekKey = weekStart.toISOString().split('T')[0];
      const weekLabel = weekStart.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      weeks.push(weekLabel);
      amounts.push(weeklyData[weekKey]?.amount || 0);
      counts.push(weeklyData[weekKey]?.count || 0);
    }

    // Calculate growth metrics
    const currentWeekAmount = amounts[amounts.length - 1];
    const previousWeekAmount = amounts[amounts.length - 2];
    const growthRate = previousWeekAmount > 0 
      ? ((currentWeekAmount - previousWeekAmount) / previousWeekAmount * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      labels: weeks,
      amounts,
      counts,
      totalAmount: amounts.reduce((sum, amount) => sum + amount, 0),
      totalCount: counts.reduce((sum, count) => sum + count, 0),
      averageWeekly: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
      growthRate: Number(growthRate)
    });

  } catch (error) {
    console.error("Error fetching donation trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch donation trends" },
      { status: 500 }
    );
  }
}
