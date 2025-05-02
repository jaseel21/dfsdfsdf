import connectToDatabase from "@/lib/db"; // Adjust path
import Box from "@/models/Box"; // Adjust path
import Donation from "@/models/Donation"; // For consistency
import { getPaymentStatus } from "@/lib/paymentStatus";


// Helper function to determine payment status
// function getPaymentStatus(lastPayment) {
//   const now = new Date();
//   const currentYear = now.getFullYear();
//   const currentMonth = now.getMonth(); // 0-11

//   if (!lastPayment) {
//     return "Pending";
//   }

//   const lastPaymentDate = new Date(lastPayment);
//   const paymentYear = lastPaymentDate.getFullYear();
//   const paymentMonth = lastPaymentDate.getMonth();

//   // Paid if last payment is in the current month/year
//   const isPaid = paymentYear === currentYear && paymentMonth === currentMonth;
//   return isPaid ? "Paid" : "Pending";
// }

export async function GET(request) {
  try {

    const { searchParams } = new URL(request.url);
    let phone = searchParams.get("phone");

    // const { searchParams } = new URL(request.url);
    //   const id = searchParams.get("id");
  
    const sessionUserPhone = phone

    if (!sessionUserPhone) {
      return new Response(JSON.stringify({ error: "Unauthorized, please log in" }), {
        status: 401,
      });
    }

    await connectToDatabase();
    const boxes = await Box.find({ "sessionUser.phone": sessionUserPhone })
      .select("serialNumber name mobileNumber lastPayment isActive")
      .lean();

    if (!boxes.length) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // Add payment status and latest donation details
    const boxesWithDetails = await Promise.all(
      boxes.map(async (box) => {
        const latestDonation = await Donation.findOne({ boxId: box._id })
          .sort({ createdAt: -1 })
          .select("amount razorpayPaymentId createdAt")
          .lean();

          const { status, period } = getPaymentStatus(box.lastPayment);
        return {
          ...box,
          paymentStatus: status,
          currentPeriod: period, // "Paid" or "Pending"
          latestPayment: latestDonation
            ? {
                amount: latestDonation.amount,
                paymentId: latestDonation.razorpayPaymentId,
                date: latestDonation.createdAt,
              }
            : null,
        };
      })
    );

    return new Response(JSON.stringify(boxesWithDetails), { status: 200 });
  } catch (error) {
    console.error("Error fetching boxes:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
