import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Yatheem from "@/models/Yatheem";
import Sponsor from "@/models/Sponsor";

// GET - Get yatheem by ID
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const yatheem = await Yatheem.findById(id)
      .populate("sponsorId", "name phone selectedAmount paidAmount type period")
      .lean();

    if (!yatheem) {
      return NextResponse.json(
        { error: "Yatheem not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...yatheem,
      _id: yatheem._id.toString(),
      sponsorId: yatheem.sponsorId ? {
        _id: yatheem.sponsorId._id.toString(),
        name: yatheem.sponsorId.name,
        phone: yatheem.sponsorId.phone,
        selectedAmount: yatheem.sponsorId.selectedAmount,
        paidAmount: yatheem.sponsorId.paidAmount,
        type: yatheem.sponsorId.type,
        period: yatheem.sponsorId.period,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching yatheem:", error);
    return NextResponse.json(
      { error: "Failed to fetch yatheem", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update yatheem
export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    // Get current yatheem to check for sponsorId changes
    const currentYatheem = await Yatheem.findById(id);
    if (!currentYatheem) {
      return NextResponse.json(
        { error: "Yatheem not found" },
        { status: 404 }
      );
    }

    // If sponsorId is being set to null, unassign from previous sponsor
    if (body.sponsorId === null && currentYatheem.sponsorId) {
      await Sponsor.findByIdAndUpdate(currentYatheem.sponsorId, {
        $unset: { yatheemId: "" },
      });
    }

    // If sponsorId is being changed, unassign from old sponsor and assign to new
    if (body.sponsorId && body.sponsorId !== currentYatheem.sponsorId?.toString()) {
      // Unassign from old sponsor if exists
      if (currentYatheem.sponsorId) {
        await Sponsor.findByIdAndUpdate(currentYatheem.sponsorId, {
          $unset: { yatheemId: "" },
        });
      }
      // Assign to new sponsor
      await Sponsor.findByIdAndUpdate(body.sponsorId, {
        yatheemId: id,
      });
    }

    const yatheem = await Yatheem.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      _id: yatheem._id.toString(),
      ...yatheem.toObject(),
    });
  } catch (error) {
    console.error("Error updating yatheem:", error);
    return NextResponse.json(
      { error: "Failed to update yatheem", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete yatheem
export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;

    // Remove yatheem reference from sponsor if assigned
    await Sponsor.updateMany(
      { yatheemId: id },
      { $unset: { yatheemId: "" } }
    );

    const yatheem = await Yatheem.findByIdAndDelete(id);

    if (!yatheem) {
      return NextResponse.json(
        { error: "Yatheem not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Yatheem deleted successfully" });
  } catch (error) {
    console.error("Error deleting yatheem:", error);
    return NextResponse.json(
      { error: "Failed to delete yatheem", details: error.message },
      { status: 500 }
    );
  }
}

