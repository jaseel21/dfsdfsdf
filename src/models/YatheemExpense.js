import mongoose from "mongoose";

const CustomFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

const YatheemExpenseSchema = new mongoose.Schema({
  yatheemId: { type: mongoose.Schema.Types.ObjectId, ref: "Yatheem", required: true },
  need: { type: String, required: true }, // Main expense need/description
  amount: { type: Number, required: true },
  customFields: [CustomFieldSchema], // Array of custom label-value pairs
  uploadedBy: { type: String }, // Admin user who uploaded
  createdAt: { type: Date, default: Date.now },
}, { 
  collection: "yatheem_expenses" 
});

export default mongoose.models.YatheemExpense || mongoose.model("YatheemExpense", YatheemExpenseSchema);

