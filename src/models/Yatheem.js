import mongoose from "mongoose";

const YatheemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  place: { type: String, required: true },
  class: { type: String, required: true },
  school: { type: String, required: true },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: "Sponsor" }, // Reference to assigned sponsor
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { 
  collection: "yatheem" 
});

YatheemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Yatheem || mongoose.model("Yatheem", YatheemSchema);

