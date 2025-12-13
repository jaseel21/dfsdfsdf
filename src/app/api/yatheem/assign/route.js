import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Yatheem from "@/models/Yatheem";
import Sponsor from "@/models/Sponsor";

// POST - Assign yatheem to sponsor
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { yatheemId, sponsorId } = body;

    if (!yatheemId || !sponsorId) {
      return NextResponse.json(
        { error: "Missing required fields: yatheemId, sponsorId" },
        { status: 400 }
      );
    }

    // Check if yatheem exists
    const yatheem = await Yatheem.findById(yatheemId);
    if (!yatheem) {
      return NextResponse.json(
        { error: "Yatheem not found" },
        { status: 404 }
      );
    }

    // Check if sponsor exists
    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) {
      return NextResponse.json(
        { error: "Sponsor not found" },
        { status: 404 }
      );
    }

    // Unassign yatheem from previous sponsor if any
    if (yatheem.sponsorId) {
      await Sponsor.findByIdAndUpdate(yatheem.sponsorId, {
        $unset: { yatheemId: "" },
      });
    }

    // Assign yatheem to new sponsor
    yatheem.sponsorId = sponsorId;
    await yatheem.save();

    // Update sponsor with yatheem reference
    sponsor.yatheemId = yatheemId;
    await sponsor.save();

    return NextResponse.json({
      message: "Yatheem assigned successfully",
      yatheem: {
        _id: yatheem._id.toString(),
        name: yatheem.name,
        sponsorId: sponsorId,
      },
      sponsor: {
        _id: sponsor._id.toString(),
        name: sponsor.name,
        yatheemId: yatheemId,
      },
    });
  } catch (error) {
    console.error("Error assigning yatheem:", error);
    return NextResponse.json(
      { error: "Failed to assign yatheem", details: error.message },
      { status: 500 }
    );
  }
}

