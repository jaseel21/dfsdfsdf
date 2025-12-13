import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Donation from "../../../../models/Donation";
import NotificationHistory from "../../../../models/notificationHistory";
import Box from "../../../../models/Box";
import Volunteer from "../../../../models/Volunteer";

// Validate API Key middleware
function validateApiKey(request) {
  const apiKey = request.headers.get('x-api-key');
  const expectedApiKey = process.env.API_KEY || '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d';
  return apiKey === expectedApiKey;
}

// GET handler to fetch recent activities for admin notifications
export async function GET(request) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid API key" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get recent activities from different sources
    const activities = [];
    
    // 1. Recent Donations (last 24 hours)
    const recentDonations = await Donation.find({
      status: "Completed",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('amount name phone type district createdAt')
    .lean();

    recentDonations.forEach(donation => {
      activities.push({
        id: `donation_${donation._id}`,
        type: 'donation',
        title: 'New Donation Received',
        message: `${donation.name || 'Anonymous'} donated ₹${donation.amount} for ${donation.type}`,
        amount: donation.amount,
        user: donation.name || 'Anonymous',
        phone: donation.phone,
        location: donation.district,
        timestamp: donation.createdAt,
        icon: 'donation',
        priority: 'high'
      });
    });

    // 2. Recent Notification Activities
    const recentNotifications = await NotificationHistory.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('title body channel status sentCount createdAt')
    .lean();

    recentNotifications.forEach(notification => {
      activities.push({
        id: `notification_${notification._id}`,
        type: 'notification',
        title: 'Notification Sent',
        message: `${notification.title} sent via ${notification.channel} to ${notification.sentCount || 0} recipients`,
        channel: notification.channel,
        status: notification.status,
        sentCount: notification.sentCount,
        timestamp: notification.createdAt,
        icon: 'notification',
        priority: 'medium'
      });
    });

    // 3. Recent Box Registrations
    const recentBoxes = await Box.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('name serialNumber location agentName agentPhone createdAt')
    .lean();

    recentBoxes.forEach(box => {
      activities.push({
        id: `box_${box._id}`,
        type: 'box_registration',
        title: 'New Box Registered',
        message: `Box #${box.serialNumber} registered by ${box.agentName || 'Unknown Agent'}`,
        boxName: box.name,
        serialNumber: box.serialNumber,
        location: box.location,
        agent: box.agentName,
        agentPhone: box.agentPhone,
        timestamp: box.createdAt,
        icon: 'box',
        priority: 'medium'
      });
    });

    // 4. Recent Volunteer Activities (if any tracking exists)
    const recentVolunteers = await Volunteer.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(2)
    .select('name phone email role district createdAt')
    .lean();

    recentVolunteers.forEach(volunteer => {
      activities.push({
        id: `volunteer_${volunteer._id}`,
        type: 'volunteer_registration',
        title: 'New Volunteer Registered',
        message: `${volunteer.name} joined as ${volunteer.role} volunteer`,
        volunteerName: volunteer.name,
        phone: volunteer.phone,
        role: volunteer.role,
        location: volunteer.district,
        timestamp: volunteer.createdAt,
        icon: 'volunteer',
        priority: 'low'
      });
    });

    // 5. High-value donations (above ₹1000)
    const highValueDonations = await Donation.find({
      status: "Completed",
      amount: { $gte: 1000 },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('amount name phone type district createdAt')
    .lean();

    highValueDonations.forEach(donation => {
      // Avoid duplicates from recent donations
      if (!activities.find(a => a.id === `donation_${donation._id}`)) {
        activities.push({
          id: `high_donation_${donation._id}`,
          type: 'high_value_donation',
          title: 'High Value Donation',
          message: `${donation.name || 'Anonymous'} made a significant donation of ₹${donation.amount}`,
          amount: donation.amount,
          user: donation.name || 'Anonymous',
          phone: donation.phone,
          location: donation.district,
          timestamp: donation.createdAt,
          icon: 'star',
          priority: 'high'
        });
      }
    });

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit the results
    const limitedActivities = activities.slice(0, limit);

    // Add formatted time strings
    const now = new Date();
    const formattedActivities = limitedActivities.map(activity => {
      const timeDiff = now - new Date(activity.timestamp);
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(timeDiff / 3600000);
      const days = Math.floor(timeDiff / 86400000);

      let timeAgo;
      if (minutes < 1) {
        timeAgo = 'Just now';
      } else if (minutes < 60) {
        timeAgo = `${minutes} min ago`;
      } else if (hours < 24) {
        timeAgo = `${hours} hr ago`;
      } else {
        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
      }

      return {
        ...activity,
        timeAgo,
        displayDate: new Date(activity.timestamp).toLocaleString()
      };
    });

    return NextResponse.json({
      success: true,
      activities: formattedActivities,
      totalCount: activities.length,
      message: activities.length > 0 ? 'Recent activities retrieved successfully' : 'No recent activities found'
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
