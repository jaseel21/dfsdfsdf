// import mongoose from 'mongoose';
// import Donation from '@/models/Donation'; // Adjust the import path to your Donation model
// import connectDB from '@/lib/db'; // Adjust the import path to your Mongoose connection file

// export async function POST() {
//   try {
//     await connectDB(); // Connect to the database

//     // Step 1: Find all razorpayPaymentId with duplicates (count > 1), excluding null paymentIds
//     const duplicates = await Donation.aggregate([
//       {
//         $group: {
//           _id: '$razorpayPaymentId',
//           count: { $sum: 1 },
//           docIds: { $push: '$_id' },
//         },
//       },
//       {
//         $match: {
//           _id: { $ne: null },
//           count: { $gt: 1 },
//         },
//       },
//     ]);

//     let totalDeleted = 0;

//     // Step 2: Process each group of duplicates
//     for (const dup of duplicates) {
//       const paymentId = dup._id;

//       // Fetch the documents in this group (only _id and name for efficiency)
//       const docs = await Donation.find(
//         { razorpayPaymentId: paymentId },
//         '_id name'
//       );

//       // Filter anonymous (assuming 'Anonymous' is the intended spelling)
//       const anonymousDocs = docs.filter((doc) => doc.name === 'Anonymous');
//       const nonAnonymousDocs = docs.filter((doc) => doc.name !== 'Anonymous');

//       // Initialize toDelete array
//       const toDelete = [];

//       // Determine remaining docs after potential anonymous removal
//       let remainingDocs = [];
//       if (nonAnonymousDocs.length > 0) {
//         // If there are non-anonymous docs, remove all anonymous duplicates
//         toDelete.push(...anonymousDocs.map((doc) => doc._id));
//         remainingDocs = nonAnonymousDocs;
//       } else {
//         // If all are anonymous, treat them as remaining
//         remainingDocs = docs;
//       }

//       // Step 3: If remaining docs > 1 and all have the same name (including null), remove all but one
//       if (remainingDocs.length > 1) {
//         // Normalize names (treat null as 'null' for comparison)
//         const names = remainingDocs.map((doc) => (doc.name ? doc.name : 'null'));
//         const uniqueNames = new Set(names);

//         if (uniqueNames.size === 1) {
//           // Same name: keep the first, delete the rest
//           toDelete.push(...remainingDocs.slice(1).map((doc) => doc._id));
//         }
//         // If names differ, do nothing
//       }

//       // Step 4: Perform batch deletion if any to delete
//       if (toDelete.length > 0) {
//         const deleteResult = await Donation.deleteMany({
//           _id: { $in: toDelete.map((id) => new mongoose.Types.ObjectId(id)) },
//         });
//         totalDeleted += deleteResult.deletedCount;
//       }
//     }

//     // Send response
//     return new Response(JSON.stringify({
//       message: 'Duplicate donations removed successfully',
//       deletedCount: totalDeleted,
//     }), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } catch (error) {
//     console.error('Error removing duplicates:', error);
//     return new Response(JSON.stringify({
//       message: 'Error removing duplicates',
//       error: error.message,
//     }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }

import mongoose from 'mongoose';
import Donation from '@/models/Donation'; // Adjust the import path to your Donation model
import connectDB from '@/lib/db'; // Adjust the import path to your Mongoose connection file

export async function POST() {
  try {
    await connectDB(); // Connect to the database

    // Step 1: Find all razorpayPaymentId with duplicates (count > 1), excluding null paymentIds
    const duplicates = await Donation.aggregate([
      {
        $group: {
          _id: '$razorpayPaymentId',
          count: { $sum: 1 },
          docIds: { $push: '$_id' },
        },
      },
      {
        $match: {
          _id: { $ne: null },
          count: { $gt: 1 },
        },
      },
    ]);

    let totalDeleted = 0;
    const deletedDocuments = []; // Array to store deleted document details

    // Step 2: Process each group of duplicates
    for (const dup of duplicates) {
      const paymentId = dup._id;

      // Fetch the documents in this group (fetch more fields if needed, not just _id and name)
      const docs = await Donation.find(
        { razorpayPaymentId: paymentId },
        'razorpayPaymentId name amount type status createdAt' // Adjust fields as needed
      );

      // Filter anonymous (assuming 'Anonymous' is the intended spelling)
      const anonymousDocs = docs.filter((doc) => doc.name === 'Anonymous');
      const nonAnonymousDocs = docs.filter((doc) => doc.name !== 'Anonymous');

      // Initialize toDelete array
      const toDelete = [];

      // Determine remaining docs after potential anonymous removal
      let remainingDocs = [];
      if (nonAnonymousDocs.length > 0) {
        // If there are non-anonymous docs, remove all anonymous duplicates
        toDelete.push(...anonymousDocs.map((doc) => doc._id));
        remainingDocs = nonAnonymousDocs;
      } else {
        // If all are anonymous, treat them as remaining
        remainingDocs = docs;
      }

      // Step 3: If remaining docs > 1 and all have the same name (including null), remove all but one
      if (remainingDocs.length > 1) {
        // Normalize names (treat null as 'null' for comparison)
        const names = remainingDocs.map((doc) => (doc.name ? doc.name : 'null'));
        const uniqueNames = new Set(names);

        if (uniqueNames.size === 1) {
          // Same name: keep the first, delete the rest
          toDelete.push(...remainingDocs.slice(1).map((doc) => doc._id));
        }
        // If names differ, do nothing
      }

      // Step 4: Fetch and store details of documents to be deleted before deletion
      if (toDelete.length > 0) {
        const docsToDelete = await Donation.find({
          _id: { $in: toDelete.map((id) => new mongoose.Types.ObjectId(id)) },
        }, 'razorpayPaymentId name amount type status createdAt'); // Adjust fields as needed
        deletedDocuments.push(...docsToDelete);

        // Perform batch deletion
        const deleteResult = await Donation.deleteMany({
          _id: { $in: toDelete.map((id) => new mongoose.Types.ObjectId(id)) },
        });
        totalDeleted += deleteResult.deletedCount;
      }
    }

    // Send response with deleted documents
    return new Response(JSON.stringify({
      message: 'Duplicate donations removed successfully',
      deletedCount: totalDeleted,
      deletedDocuments: deletedDocuments, // Include deleted document details
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error removing duplicates:', error);
    return new Response(JSON.stringify({
      message: 'Error removing duplicates',
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}