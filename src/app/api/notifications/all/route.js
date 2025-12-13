import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Notification from "../../../../models/notification";

// Validate API Key middleware
function validateApiKey(request) {
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.API_KEY || '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d';
    return apiKey && apiKey === validApiKey;
}

// GET handler to fetch notifications sent within last 7 days
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

        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch notifications sent within last 7 days, newest first
        const notifications = await Notification.find(
            { createdAt: { $gte: sevenDaysAgo } },
            { imageUrl: 1, buttonText: 1, buttonLink: 1, _id: 0 }
        ).sort({ createdAt: -1 }).lean();

        return NextResponse.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}