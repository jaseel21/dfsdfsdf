import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Donation from "../../../../models/Donation";
import NotificationHistory from "../../../../models/notificationHistory";
import Box from "../../../../models/Box";
import Volunteer from "../../../../models/Volunteer";

// Type definitions
interface DateFilter {
  $gte?: Date;
  $lte?: Date;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  timeAgo?: string;
  displayDate?: string;
  amount?: number;
  user?: string;
  phone?: string;
  location?: string;
  channel?: string;
  status?: string;
  sentCount?: number;
  boxName?: string;
  serialNumber?: string;
  agent?: string;
  agentPhone?: string;
  volunteerName?: string;
  role?: string;
}

// Validate API Key middleware
function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedApiKey = process.env.API_KEY || '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d';
  return apiKey === expectedApiKey;
}

// GET handler to fetch recent activities for admin notifications
export async function GET(request: Request) {
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
    const page = parseInt(searchParams.get('page') || '1');
    const type = searchParams.get('type') || '';
    const priority = searchParams.get('priority') || '';
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    
    // Build date filter
    const dateFilter: DateFilter = {};
    if (dateFrom) {
      dateFilter.$gte = new Date(dateFrom);
    } else {
      // Default to last 7 days if no date filter
      dateFilter.$gte = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    if (dateTo) {
      dateFilter.$lte = new Date(dateTo);
    }
    
    // Get recent activities from different sources
    const activities: Activity[] = [];
    
    // 1. Recent Donations (filter by type and date)
    if (!type || type === 'donations' || type === 'all') {
      const recentDonations = await Donation.find({
        status: "Completed",
        createdAt: dateFilter
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('amount name phone type district createdAt')
      .lean();

      recentDonations.forEach((donation) => {
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
    }

    // 2. Recent Notification Activities
    if (!type || type === 'notifications' || type === 'all') {
      const recentNotifications = await NotificationHistory.find({
        createdAt: dateFilter
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title body channel status sentCount createdAt')
      .lean();

      recentNotifications.forEach((notification) => {
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
    }

    // 3. Recent Box Registrations
    if (!type || type === 'boxes' || type === 'all') {
      const recentBoxes = await Box.find({
        createdAt: dateFilter
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name serialNumber location agentName agentPhone createdAt')
      .lean();

      recentBoxes.forEach((box) => {
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
    }

    // 4. Recent Volunteer Activities
    if (!type || type === 'volunteers' || type === 'all') {
      const recentVolunteers = await Volunteer.find({
        createdAt: dateFilter
      })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('name phone email role district createdAt')
      .lean();

      recentVolunteers.forEach((volunteer) => {
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
    }

    // 5. High-value donations (above ₹1000)
    if (!type || type === 'highValue' || type === 'all') {
      const highValueDonations = await Donation.find({
        status: "Completed",
        amount: { $gte: 1000 },
        createdAt: dateFilter
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('amount name phone type district createdAt')
      .lean();

      highValueDonations.forEach((donation) => {
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
    }

    // Apply search filter if provided
    let filteredActivities = activities;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredActivities = activities.filter(activity => 
        activity.title.toLowerCase().includes(searchLower) ||
        activity.message.toLowerCase().includes(searchLower) ||
        (activity.user && activity.user.toLowerCase().includes(searchLower)) ||
        (activity.location && activity.location.toLowerCase().includes(searchLower))
      );
    }

    // Apply priority filter if provided
    if (priority) {
      filteredActivities = filteredActivities.filter(activity => activity.priority === priority);
    }

    // Sort all activities by timestamp (newest first)
    filteredActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedActivities = filteredActivities.slice(startIndex, startIndex + limit);

    // Add formatted time strings
    const now = new Date();
    const formattedActivities = paginatedActivities.map(activity => {
      const timeDiff = now.getTime() - new Date(activity.timestamp).getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(timeDiff / 3600000);
      const days = Math.floor(timeDiff / 86400000);

      let timeAgo: string;
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
      totalCount: filteredActivities.length,
      pagination: {
        page: page,
        limit: limit,
        total: filteredActivities.length,
        hasMore: (page * limit) < filteredActivities.length
      },
      stats: {
        totalActivities: activities.length,
        byType: {
          donations: activities.filter(a => a.type === 'donation').length,
          notifications: activities.filter(a => a.type === 'notification').length,
          boxes: activities.filter(a => a.type === 'box_registration').length,
          volunteers: activities.filter(a => a.type === 'volunteer_registration').length,
          highValue: activities.filter(a => a.type === 'high_value_donation').length
        },
        byPriority: {
          high: activities.filter(a => a.priority === 'high').length,
          medium: activities.filter(a => a.priority === 'medium').length,
          low: activities.filter(a => a.priority === 'low').length
        }
      },
      message: formattedActivities.length > 0 ? 'Recent activities retrieved successfully' : 'No recent activities found'
    });

  } catch (error: unknown) {
    console.error('Error fetching recent activities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
