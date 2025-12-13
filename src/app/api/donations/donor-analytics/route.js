import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Donation from "../../../../models/Donation";

export async function GET(request) {
  try {
    console.log("Starting donor analytics API...");
    await connectToDatabase();
    console.log("Database connected successfully");

    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const panchayat = searchParams.get("panchayat");
    const sortBy = searchParams.get("sortBy") || "totalAmount";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const searchTerm = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 25;

    console.log("Query params:", { district, panchayat, sortBy, sortOrder, searchTerm, page, limit });

    // Test basic count first
    const totalDonations = await Donation.countDocuments({ status: "Completed" });
    console.log("Total completed donations:", totalDonations);

    if (totalDonations === 0) {
      console.log("No completed donations found");
      return NextResponse.json({
        success: true,
        donors: [],
        locationStats: [],
        overallStats: {
          totalDonors: 0,
          totalAmount: 0,
          totalDonations: 0,
          averageDonationAmount: 0
        }
      });
    }

    // Build aggregation pipeline
    const pipeline = [
      // Match completed donations only
      {
        $match: {
          status: "Completed"
        }
      }
    ];

    // Add location filters if specified
    if (district && district !== "all") {
      pipeline[0].$match.district = district;
    }
    if (panchayat && panchayat !== "all") {
      pipeline[0].$match.panchayat = panchayat;
    }

    // Add search filter if specified
    if (searchTerm) {
      pipeline[0].$match.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } }
      ];
    }

    // Group by phone number to aggregate donor data
    pipeline.push({
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
    });

    // Filter out donors without any identifier
    pipeline.push({
      $match: {
        _id: { $ne: null }
      }
    });

    // Add computed fields
    pipeline.push({
      $addFields: {
        averageAmount: { $divide: ["$totalAmount", "$donationCount"] },
        donorSince: "$firstDonation"
      }
    });

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
    console.log(`Donors aggregation result: ${donors.length} donors found (page ${page} of ${Math.ceil(totalDonors / limit)})`);

    // Get location statistics
    const locationStats = await Donation.aggregate([
      {
        $match: {
          status: "Completed"
        }
      },
      {
        $group: {
          _id: {
            district: "$district",
            panchayat: "$panchayat"
          },
          uniqueDonors: { $addToSet: { $ifNull: ["$phone", "$email"] } },
          totalAmount: { $sum: "$amount" },
          totalDonations: { $sum: 1 }
        }
      },
      {
        $addFields: {
          uniqueDonorCount: { $size: "$uniqueDonors" }
        }
      },
      {
        $group: {
          _id: "$_id.district",
          panchayats: {
            $push: {
              name: "$_id.panchayat",
              uniqueDonors: "$uniqueDonorCount",
              totalAmount: "$totalAmount",
              totalDonations: "$totalDonations"
            }
          },
          districtTotal: { $sum: "$totalAmount" },
          districtDonors: { $sum: "$uniqueDonorCount" },
          districtDonations: { $sum: "$totalDonations" }
        }
      },
      {
        $sort: { districtTotal: -1 }
      }
    ]);
    console.log("Location stats result:", locationStats.length, "districts found");

    // Get overall statistics
    const overallStats = await Donation.aggregate([
      {
        $match: {
          status: "Completed"
        }
      },
      {
        $group: {
          _id: null,
          totalDonors: { $addToSet: { $ifNull: ["$phone", "$email"] } },
          totalAmount: { $sum: "$amount" },
          totalDonations: { $sum: 1 },
          avgDonationAmount: { $avg: "$amount" }
        }
      },
      {
        $addFields: {
          uniqueDonorCount: { $size: "$totalDonors" }
        }
      }
    ]);

    const stats = overallStats[0] || {
      uniqueDonorCount: 0,
      totalAmount: 0,
      totalDonations: 0,
      avgDonationAmount: 0
    };

    console.log("Overall stats:", stats);

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

    console.log("Formatted response:", {
      donorsCount: formattedDonors.length,
      totalDonors: totalDonors,
      currentPage: page,
      totalPages: totalPages,
      locationStatsCount: locationStats.length,
      overallStats: {
        totalDonors: stats.uniqueDonorCount,
        totalAmount: stats.totalAmount,
        totalDonations: stats.totalDonations,
        averageDonationAmount: Math.round(stats.avgDonationAmount || 0)
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
      locationStats,
      overallStats: {
        totalDonors: stats.uniqueDonorCount,
        totalAmount: stats.totalAmount,
        totalDonations: stats.totalDonations,
        averageDonationAmount: Math.round(stats.avgDonationAmount || 0)
      }
    });

  } catch (error) {
    console.error("Error fetching donor analytics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch donor analytics" },
      { status: 500 }
    );
  }
}
