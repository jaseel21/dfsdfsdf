import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    channel: String,
    userGroup: String,
    body: String,
    status: String,
    templateId: String,
    title: String,
    imageUrl: String,
    buttonText: String,
    buttonLink: String,
    subject: String,
    scheduledFor: Date,
    sentAt: Date,
    historyId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);