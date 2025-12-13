import mongoose from "mongoose";
import { NextResponse } from "next/server";
import Subscription from "@/models/Subscription";
import CancelledSubscription from "@/models/CancelledSubscription";
import { paymentStatusMiddleware, getPaymentStatus } from "../../../../middleware/getPaymentStatus";

async function handler() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get all subscriptions
    const subscriptions = await Subscription.find().lean();
    
    // Get cancelled subscriptions count
    const cancelledSubscriptions = await CancelledSubscription.find().lean();
    
    // Enrich with payment status
    const enrichedSubscriptions = subscriptions.map((sub) => ({
      ...sub,
      paymentStatus: getPaymentStatus(sub.period, sub.lastPaymentAt),
    }));

    // Calculate current month data
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthSubs = enrichedSubscriptions.filter(sub => {
      const createdAt = new Date(sub.createdAt);
      return createdAt >= firstDayOfMonth;
    });

    const lastMonthSubs = enrichedSubscriptions.filter(sub => {
      const createdAt = new Date(sub.createdAt);
      return createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth;
    });

    // Calculate revenue
    const calculateRevenue = (subs) => {
      return subs.reduce((total, sub) => {
        if (sub.paymentStatus === "paid") {
          return total + (sub.amount || 0);
        }
        return total;
      }, 0);
    };

    // Basic counts
    const total = enrichedSubscriptions.length + cancelledSubscriptions.length; // Total includes cancelled
    const active = enrichedSubscriptions.filter(sub => sub.status === "active").length;
    const cancelled = cancelledSubscriptions.length; // Count from cancelled collection
    
    // Method counts (including cancelled subscriptions)
    const autoActive = enrichedSubscriptions.filter(sub => sub.method === "auto").length;
    const autoCancelled = cancelledSubscriptions.filter(sub => sub.method === "auto").length;
    const auto = autoActive + autoCancelled;
    
    const manualActive = enrichedSubscriptions.filter(sub => sub.method === "manual").length;
    const manualCancelled = cancelledSubscriptions.filter(sub => sub.method === "manual").length;
    const manual = manualActive + manualCancelled;

    // Revenue calculations
    const totalRevenue = calculateRevenue(enrichedSubscriptions);
    const monthlyRevenue = calculateRevenue(thisMonthSubs);
    const lastMonthRevenue = calculateRevenue(lastMonthSubs);

    // Growth calculations
    const subscriberGrowth = lastMonthSubs.length > 0 ? 
      ((thisMonthSubs.length - lastMonthSubs.length) / lastMonthSubs.length * 100) : 0;
    
    const revenueGrowth = lastMonthRevenue > 0 ? 
      ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

    // Payment status breakdown
    const paid = enrichedSubscriptions.filter(sub => sub.paymentStatus === "paid").length;
    const pending = enrichedSubscriptions.filter(sub => sub.paymentStatus === "pending").length;

    // Period breakdown (including cancelled subscriptions)
    const dailyActive = enrichedSubscriptions.filter(sub => sub.period === "daily").length;
    const dailyCancelled = cancelledSubscriptions.filter(sub => sub.period === "daily").length;
    const daily = dailyActive + dailyCancelled;
    
    const weeklyActive = enrichedSubscriptions.filter(sub => sub.period === "weekly").length;
    const weeklyCancelled = cancelledSubscriptions.filter(sub => sub.period === "weekly").length;
    const weekly = weeklyActive + weeklyCancelled;
    
    const monthlyActive = enrichedSubscriptions.filter(sub => sub.period === "monthly").length;
    const monthlyCancelled = cancelledSubscriptions.filter(sub => sub.period === "monthly").length;
    const monthly = monthlyActive + monthlyCancelled;
    
    const yearlyActive = enrichedSubscriptions.filter(sub => sub.period === "yearly").length;
    const yearlyCancelled = cancelledSubscriptions.filter(sub => sub.period === "yearly").length;
    const yearly = yearlyActive + yearlyCancelled;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSubscriptions = enrichedSubscriptions.filter(sub => {
      const createdAt = new Date(sub.createdAt);
      return createdAt >= sevenDaysAgo;
    });

    // Top performers this month
    const amountGroups = enrichedSubscriptions.reduce((acc, sub) => {
      const amount = sub.amount || 0;
      acc[amount] = (acc[amount] || 0) + 1;
      return acc;
    }, {});

    const topAmounts = Object.entries(amountGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([amount, count]) => ({
        amount: parseInt(amount),
        count,
        revenue: parseInt(amount) * count
      }));

    const analytics = {
      overview: {
        total,
        active,
        cancelled,
        auto,
        manual,
        totalRevenue,
        monthlyRevenue,
        subscriberGrowth: Number(subscriberGrowth.toFixed(2)),
        revenueGrowth: Number(revenueGrowth.toFixed(2))
      },
      paymentStatus: {
        paid,
        pending
      },
      periods: {
        daily,
        weekly,
        monthly,
        yearly
      },
      recentActivity: {
        newSubscriptions: recentSubscriptions.length,
        recentRevenue: calculateRevenue(recentSubscriptions)
      },
      topAmounts,
      monthlyComparison: {
        thisMonth: {
          subscriptions: thisMonthSubs.length,
          revenue: monthlyRevenue
        },
        lastMonth: {
          subscriptions: lastMonthSubs.length,
          revenue: lastMonthRevenue
        }
      }
    };

    return NextResponse.json({
      success: true,
      analytics,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching subscription analytics:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export const GET = paymentStatusMiddleware(handler);