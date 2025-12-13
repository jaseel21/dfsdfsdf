import Razorpay from "razorpay";
import connectDB from "../../../lib/db";
import Subscription from "../../../models/AutoSubscription";
import CancelledSubscription from "../../../models/CancelledSubscription";
import { NextResponse } from "next/server";
import Donor from "../../../models/Donor";
import twilio from "twilio";
import mongoose from "mongoose";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request) {
  await connectDB();

  try {
    const { subscriptionId } = await request.json();
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionId,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const donor = await Donor.findById(subscription.donorId);
    if (!donor) {
      return NextResponse.json(
        { error: "Donor not found" },
        { status: 404 }
      );
    }

    // Try to cancel with Razorpay first
    try {
      await razorpay.subscriptions.cancel(subscriptionId);
      console.log("Razorpay subscription cancelled successfully");
    } catch (razorpayError) {
      console.error("Razorpay cancellation error:", razorpayError);
      
      // Handle specific Razorpay errors but be more permissive
      if (razorpayError.error && razorpayError.error.code) {
        if (razorpayError.error.description?.includes('already cancelled') ||
            razorpayError.error.description?.includes('does not exist') ||
            razorpayError.error.description?.includes('not found')) {
          // If already cancelled, doesn't exist, or not found in Razorpay, continue with local cleanup
          console.log("Subscription not active in Razorpay (already cancelled/doesn't exist), proceeding with local cleanup");
        } else {
          // Only return error for other critical issues
          console.log("Critical Razorpay error, proceeding with local cleanup anyway");
        }
      } else {
        // For unknown errors, still proceed with cleanup
        console.log("Unknown Razorpay error, proceeding with local cleanup anyway");
      }
    }

    // Only save cancelled subscription data AFTER successful Razorpay cancellation (or if already cancelled)
    console.log("Attempting to save cancelled subscription data...");
    try {
      const cancelledData = {
        originalSubscriptionId: subscription._id,
        originalDonorId: subscription.donorId,
        razorpaySubscriptionId: subscription.razorpaySubscriptionId,
        planId: subscription.planId,
        name: donor.name,
        email: donor.email,
        phone: donor.phone || subscription.phone,
        district: subscription.district,
        panchayat: subscription.panchayat,
        amount: subscription.amount,
        period: subscription.period, // Keep as period
        method: subscription.method || 'auto',
        cancelledAt: new Date(),
        cancelledBy: 'admin',
        cancellationReason: 'Manual cancellation by admin',
        originalCreatedAt: subscription.createdAt,
        lastPaymentAt: subscription.lastPaymentAt,
        totalPaymentsMade: subscription.totalPaymentsMade || 0,
        donationHistory: subscription.donationHistory || [],
        metadata: {
          subscriptionStatus: subscription.status,
          originalData: subscription.toObject()
        }
      };
      
      console.log("Cancelled subscription data to save:", JSON.stringify(cancelledData, null, 2));
      
      const savedCancelledSubscription = await new CancelledSubscription(cancelledData).save();
      console.log("Cancelled subscription data saved successfully with ID:", savedCancelledSubscription._id);
    } catch (saveError) {
      console.error("Error saving cancelled subscription data:", saveError);
      console.error("Error details:", saveError.message);
      // Continue with the process even if saving fails
    }

    const donorObjectId = new mongoose.Types.ObjectId(subscription.donorId);
    const subscriptionObjectId = new mongoose.Types.ObjectId(subscription._id);

    await Donor.deleteOne({ _id: donorObjectId });
    await Subscription.deleteOne({ _id: subscriptionObjectId });

    const fromNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
    const to = `whatsapp:${subscription.phone}`;

    try {
      await twilioClient.messages.create({
        body: `Your ${subscription.period} donation subscription has been cancelled. Thank you for your support!`,
        from: fromNumber,
        to: to,
      });
    } catch (twilioError) {
      console.error("Twilio error:", twilioError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled",
      subscriptionId: subscriptionId,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
