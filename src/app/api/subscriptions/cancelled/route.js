import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import CancelledSubscription from "../../../../models/CancelledSubscription";

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const method = searchParams.get('method') || 'all';
    const period = searchParams.get('period') || 'all';
    const sortBy = searchParams.get('sortBy') || 'cancelledAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query object
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (method !== 'all') {
      query.method = method;
    }
    
    if (period !== 'all') {
      query.period = period;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch cancelled subscriptions with pagination
    const cancelledSubscriptions = await CancelledSubscription.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Map the data to match frontend expectations
    const mappedSubscriptions = cancelledSubscriptions.map(sub => ({
      _id: sub._id,
      donorName: sub.name,
      donorEmail: sub.email,
      donorPhone: sub.phone,
      amount: sub.amount,
      causeType: 'general', // Default since not in current model
      frequency: sub.period,
      paymentMethod: sub.method,
      razorpaySubscriptionId: sub.razorpaySubscriptionId,
      createdAt: sub.originalCreatedAt,
      cancelledAt: sub.cancelledAt,
      lastPaymentDate: sub.lastPaymentAt,
      totalPaymentsMade: sub.totalPaymentsMade,
      cancelledBy: sub.cancelledBy,
      cancellationReason: sub.cancellationReason,
      originalSubscriptionId: sub.originalSubscriptionId
    }));

    // Get total count for pagination
    const totalCount = await CancelledSubscription.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate statistics
    const stats = await CancelledSubscription.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCancelled: { $sum: 1 },
          totalAmountLost: { $sum: "$totalAmountPaid" },
          autoCount: {
            $sum: { $cond: [{ $eq: ["$method", "auto"] }, 1, 0] }
          },
          manualCount: {
            $sum: { $cond: [{ $eq: ["$method", "manual"] }, 1, 0] }
          }
        }
      }
    ]);

    const statistics = stats.length > 0 ? stats[0] : {
      totalCancelled: 0,
      totalAmountLost: 0,
      autoCount: 0,
      manualCount: 0
    };

    return NextResponse.json({
      cancelledSubscriptions: mappedSubscriptions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics
    });

  } catch (error) {
    console.error("Error fetching cancelled subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch cancelled subscriptions", details: error.message },
      { status: 500 }
    );
  }
}
