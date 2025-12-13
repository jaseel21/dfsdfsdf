import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import YatheemExpense from "@/models/YatheemExpense";

// PUT - Update expense
export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    const expense = await YatheemExpense.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: expense._id.toString(),
      ...expense.toObject(),
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const expense = await YatheemExpense.findByIdAndDelete(id);

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense", details: error.message },
      { status: 500 }
    );
  }
}

