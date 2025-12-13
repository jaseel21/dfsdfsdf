import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Yatheem from "@/models/Yatheem";
import Sponsor from "@/models/Sponsor";

// GET - List all yatheem
export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { place: { $regex: search, $options: "i" } },
        { school: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const yatheem = await Yatheem.find(query)
      .populate("sponsorId", "name phone selectedAmount paidAmount")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(yatheem.map(y => ({
      ...y,
      _id: y._id.toString(),
      sponsorId: y.sponsorId ? {
        _id: y.sponsorId._id.toString(),
        name: y.sponsorId.name,
        phone: y.sponsorId.phone,
        selectedAmount: y.sponsorId.selectedAmount,
        paidAmount: y.sponsorId.paidAmount,
      } : null,
    })));
  } catch (error) {
    console.error("Error fetching yatheem:", error);
    return NextResponse.json(
      { error: "Failed to fetch yatheem", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new yatheem
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { name, phone, place, class: className, school } = body;

    if (!name || !phone || !place || !className || !school) {
      return NextResponse.json(
        { error: "Missing required fields: name, phone, place, class, school" },
        { status: 400 }
      );
    }

    const yatheem = new Yatheem({
      name,
      phone,
      place,
      class: className,
      school,
      status: "Active",
    });

    await yatheem.save();

    return NextResponse.json({
      _id: yatheem._id.toString(),
      ...yatheem.toObject(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating yatheem:", error);
    return NextResponse.json(
      { error: "Failed to create yatheem", details: error.message },
      { status: 500 }
    );
  }
}

