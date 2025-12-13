import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Donation from "../../../../models/Donation";

export async function GET(request) {
  try {
    console.log("Starting donors by location API...");
    await connectToDatabase();
    console.log("Database connected successfully");

    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const panchayat = searchParams.get("panchayat");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 25;
    const sortBy = searchParams.get("sortBy") || "totalAmount";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    console.log("Query params:", { district, panchayat, page, limit, sortBy, sortOrder });

    if (!district) {
      return NextResponse.json(
        { success: false, message: "District is required" },
        { status: 400 }
      );
    }

    // Build aggregation pipeline
    const matchStage = {
      status: "Completed",
      district: district
    };

    // Add panchayat filter if specified
    if (panchayat && panchayat !== "all") {
      matchStage.panchayat = panchayat;
    }

    const pipeline = [
      // Match completed donations for the specified location
      {
        $match: matchStage
      },
      // Group by phone number to aggregate donor data
      {
        $group: {
          _id: { $ifNull: ["$phone", "$email"] }, // Use phone or email as grouping key
          name: { $first: "$name" },
          email: { $first: "$email" },
          phone: { $first: "$phone" },
          district: { $first: "$district" },
          panchayat: { $first: "$panchayat" },
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
          firstDonation: { $min: "$createdAt" },
          lastDonation: { $max: "$createdAt" },
          donations: {
            $push: {
              amount: "$amount",
              type: "$type",
              date: "$createdAt",
              status: "$status"
            }
          }
        }
      },
      // Filter out donors without any identifier
      {
        $match: {
          _id: { $ne: null }
        }
      },
      // Add computed fields
      {
        $addFields: {
          averageAmount: { $divide: ["$totalAmount", "$donationCount"] },
          donorSince: "$firstDonation"
        }
      }
    ];

    // Sort based on parameters
    let sortField = "totalAmount";
    switch (sortBy) {
      case "donationCount":
        sortField = "donationCount";
        break;
      case "averageAmount":
        sortField = "averageAmount";
        break;
      case "lastDonation":
        sortField = "lastDonation";
        break;
      case "name":
        sortField = "name";
        break;
      default:
        sortField = "totalAmount";
    }

    pipeline.push({
      $sort: { [sortField]: sortOrder === "desc" ? -1 : 1 }
    });

    // Get total count for pagination before applying skip/limit
    const totalCountPipeline = [...pipeline, { $count: "total" }];
    const totalCountResult = await Donation.aggregate(totalCountPipeline);
    const totalDonors = totalCountResult[0]?.total || 0;

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const donors = await Donation.aggregate(pipeline);
    console.log(`Donors by location result: ${donors.length} donors found for ${district}${panchayat ? `/${panchayat}` : ''} (page ${page} of ${Math.ceil(totalDonors / limit)})`);

    // Get location statistics summary
    const locationSummary = await Donation.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: null,
          totalDonors: { $addToSet: { $ifNull: ["$phone", "$email"] } },
          totalAmount: { $sum: "$amount" },
          totalDonations: { $sum: 1 }
        }
      },
      {
        $addFields: {
          uniqueDonorCount: { $size: "$totalDonors" }
        }
      }
    ]);

    const summary = locationSummary[0] || {
      uniqueDonorCount: 0,
      totalAmount: 0,
      totalDonations: 0
    };

    // Format response
    const formattedDonors = donors.map((donor, index) => ({
      rank: skip + index + 1, // Adjust rank based on current page
      id: donor._id,
      name: donor.name || "Anonymous",
      email: donor.email || "",
      phone: donor.phone,
      district: donor.district || "Not specified",
      panchayat: donor.panchayat || "Not specified",
      totalAmount: donor.totalAmount,
      donationCount: donor.donationCount,
      averageAmount: Math.round(donor.averageAmount || 0),
      firstDonation: donor.firstDonation,
      lastDonation: donor.lastDonation,
      donorSince: donor.donorSince,
      donations: donor.donations
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalDonors / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    console.log("Location donors response:", {
      donorsCount: formattedDonors.length,
      totalDonors: totalDonors,
      currentPage: page,
      totalPages: totalPages,
      location: `${district}${panchayat ? `/${panchayat}` : ''}`,
      summary: {
        totalDonors: summary.uniqueDonorCount,
        totalAmount: summary.totalAmount,
        totalDonations: summary.totalDonations
      }
    });

    return NextResponse.json({
      success: true,
      donors: formattedDonors,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalDonors: totalDonors,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        startIndex: skip + 1,
        endIndex: Math.min(skip + limit, totalDonors)
      },
      locationInfo: {
        district: district,
        panchayat: panchayat || "All Panchayats",
        totalDonors: summary.uniqueDonorCount,
        totalAmount: summary.totalAmount,
        totalDonations: summary.totalDonations
      }
    });

  } catch (error) {
    console.error("Error fetching donors by location:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch donors by location" },
      { status: 500 }
    );
  }
}
