import { NextResponse } from "next/server";
import Donation from "@/models/Donation"; // Adjust the path to your Donation model

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters with validation
    const params = {
      searchText: searchParams.get("search") || "",
      selectedType: searchParams.get("type") || "",
      selectedStatus: searchParams.get("status") || "",
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") === "asc" ? 1 : -1,
      page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10))),
      exportAll: searchParams.get("exportAll") === "true",
    };

    // Build MongoDB query
    const query = {};
    if (params.searchText) {
      query.$or = [
        { name: { $regex: params.searchText, $options: "i" } },
        { email: { $regex: params.searchText, $options: "i" } },
        { phone: { $regex: params.searchText, $options: "i" } },
        { razorpayOrderId: { $regex: params.searchText, $options: "i" } },
      ];
    }
    if (params.selectedType) {
      // Handle type filtering considering the transformation logic
      if (params.selectedType === "Subscription-Auto") {
        query.$or = [
          { type: "Subscription-Auto" },
          { type: "General", method: "auto" },
        ];
      } else if (params.selectedType === "Subscription-Manual") {
        query.$or = [
          { type: "Subscription-Manual" },
          { type: "General", method: "manual" },
        ];
      } else {
        query.type = params.selectedType;
      }
    }
    if (params.selectedStatus) {
      query.status = params.selectedStatus;
    }

    // Fetch all matching donations, including the method field
    let donations = await Donation.find(query)
      .select("razorpayOrderId name email phone amount type status createdAt method") // Include method field
      .sort({ [params.sortBy]: params.sortOrder })
      .lean();

    // Filter by date in JS
    if (params.dateFrom || params.dateTo) {
      const fromDate = params.dateFrom ? new Date(params.dateFrom) : null;
      const toDate = params.dateTo ? new Date(params.dateTo) : null;

      donations = donations.filter((donation) => {
        const createdAt = donation.createdAt
          ? new Date(donation.createdAt)
          : null;
        if (!createdAt || isNaN(createdAt.getTime())) return false;
        if (fromDate && createdAt < fromDate) return false;
        if (toDate && createdAt > toDate) return false;
        return true;
      });
    }

    // Pagination after filtering
    const totalItems = donations.length;
    const paginatedDonations = params.exportAll
      ? donations
      : donations.slice((params.page - 1) * params.limit, params.page * params.limit);

    // Format donations with type transformation
    const formattedDonations = paginatedDonations.map((donation) => {
      const createdAtDate = donation.createdAt ? new Date(donation.createdAt) : null;
      const amountString =
        donation?.amount !== undefined && donation?.amount !== null
          ? String(donation.amount)
          : "0";

      // Transform type based on method
      let transformedType = donation.type || "General";
      if (donation.type === "General" && donation.method === "auto") {
        transformedType = "Subscription-Auto";
      } else if (donation.type === "General" && donation.method === "manual") {
        transformedType = "Subscription-Manual";
      }

      return {
        id: donation.razorpayOrderId || "N/A",
        _id: donation._id.toString(),
        donor: donation.name || "Anonymous",
        email: donation.email || "N/A",
        phone: donation.phone || "N/A",
        amount: amountString,
        type: transformedType,
        status: donation.status || "Pending",
        date: createdAtDate ? createdAtDate.toISOString() : "N/A",
        displayDate: createdAtDate
          ? createdAtDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "N/A",
        razorpayOrderId: donation.razorpayOrderId || "N/A",
        name: donation.name || "Anonymous",
        createdAt: createdAtDate ? createdAtDate.toISOString() : "N/A",
        createdAtTimestamp: createdAtDate ? createdAtDate.getTime() : 0,
      };
    });

    const result = {
      donations: formattedDonations,
      totalItems,
      totalPages: Math.ceil(totalItems / params.limit),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch donations",
        message: error.message || "Unknown error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}