import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import YatheemExpense from "@/models/YatheemExpense";

// GET - Get expenses for a yatheem
export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const yatheemId = searchParams.get("yatheemId");

    if (!yatheemId) {
      return NextResponse.json(
        { error: "yatheemId is required" },
        { status: 400 }
      );
    }

    const expenses = await YatheemExpense.find({ yatheemId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(expenses.map(exp => ({
      ...exp,
      _id: exp._id.toString(),
      yatheemId: exp.yatheemId.toString(),
    })));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new expense
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { yatheemId, need, amount, customFields, uploadedBy } = body;

    if (!yatheemId || !need || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: yatheemId, need, amount" },
        { status: 400 }
      );
    }

    const expense = new YatheemExpense({
      yatheemId,
      need,
      amount: parseFloat(amount),
      customFields: customFields || [],
      uploadedBy: uploadedBy || "admin",
    });

    await expense.save();

    return NextResponse.json({
      _id: expense._id.toString(),
      ...expense.toObject(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense", details: error.message },
      { status: 500 }
    );
  }
}

