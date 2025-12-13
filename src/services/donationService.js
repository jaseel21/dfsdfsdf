import connectToDatabase from '../lib/db';
import Donation from '../models/Donation';

export const donationService = {
  /**
   * Get all donations with filtering, sorting and pagination
   */
  async getAllDonations({ 
    searchText = '', 
    selectedType = '', 
    selectedStatus = '', 
    dateFrom = '', 
    dateTo = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    page = 1, 
    limit = 10,
    exportAll = false // Flag to return all data for export
  } = {}) {
    await connectToDatabase();
    
    // Debug: Check what subscription data we actually have
    if (selectedType && selectedType.includes('Subscription')) {
      console.log('SUBSCRIPTION DEBUG: Starting subscription query for:', selectedType);
      
      // First, let's see what types are actually in the database
      const allTypes = await Donation.distinct('type');
      console.log('SUBSCRIPTION DEBUG: All donation types in DB:', allTypes);
      
      // Check what documents have subscription-related fields
      const subscriptionDocs = await Donation.find({
        $or: [
          { subscriptionId: { $exists: true, $ne: null } },
          { method: { $exists: true, $ne: null } },
          { period: { $exists: true, $ne: null } },
          { razorpaySubscriptionId: { $exists: true, $ne: null } }
        ]
      }).limit(5).lean();
      
      console.log('SUBSCRIPTION DEBUG: Found', subscriptionDocs.length, 'docs with subscription fields');
      subscriptionDocs.forEach((doc, index) => {
        console.log(`SUBSCRIPTION DEBUG: Doc ${index + 1}:`, {
          _id: doc._id,
          type: doc.type,
          method: doc.method,
          subscriptionId: doc.subscriptionId,
          period: doc.period,
          razorpaySubscriptionId: doc.razorpaySubscriptionId,
          name: doc.name
        });
      });
      
      // Let's also check if there are ANY documents with specific methods
      const autoMethodDocs = await Donation.countDocuments({ method: 'auto' });
      const manualMethodDocs = await Donation.countDocuments({ method: 'manual' });
      console.log('SUBSCRIPTION DEBUG: Documents with method=auto:', autoMethodDocs);
      console.log('SUBSCRIPTION DEBUG: Documents with method=manual:', manualMethodDocs);
    }
    
    // Build the filter query
    const query = {};
    
    // Search text across multiple fields
    if (searchText) {
      query.$or = [
        { name: { $regex: searchText, $options: 'i' } },
        { phone: { $regex: searchText, $options: 'i' } },
        { razorpayOrderId: { $regex: searchText, $options: 'i' } },
        { email: { $regex: searchText, $options: 'i' } }
      ];
    }
    
    // Type filter - handle subscription types specially
    if (selectedType) {
      console.log('FILTER DEBUG: Filtering by type:', selectedType);
      
      if (selectedType === 'Subscription-Auto') {
        // Simple query for auto subscriptions
        console.log('FILTER DEBUG: Setting up Subscription-Auto query');
        query.method = 'auto';
        query.type = { $not: { $regex: '^Sponsor', $options: 'i' } };
      } else if (selectedType === 'Subscription-Manual') {
        // Simple query for manual subscriptions
        console.log('FILTER DEBUG: Setting up Subscription-Manual query');
        query.$and = [
          {
            $or: [
              { method: 'manual' },
              { method: 'Manual' },
              { method: { $exists: false } },
              { method: null }
            ]
          },
          // Must have subscription indicators
          {
            $or: [
              { subscriptionId: { $exists: true, $ne: null } },
              { period: { $exists: true, $ne: null } }
            ]
          },
          // Exclude sponsorships
          { type: { $not: { $regex: '^Sponsor', $options: 'i' } } }
        ];
      } else {
        // Regular type filtering for non-subscription types
        console.log('FILTER DEBUG: Setting up regular type query for:', selectedType);
        query.type = selectedType;
      }
    }
    
    // Status filter
    if (selectedStatus) {
      query.status = selectedStatus;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        // Add one day to include the end date fully
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query.createdAt.$lte = endDate;
      }
    }
    
    // Build sort options
    const sortOptions = {};
    
    // Handle special cases for sorting
    if (sortBy === 'amount') {
      // Ensure numeric sorting for amount
      sortOptions.amount = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      // Case-insensitive sorting for donor names
      sortOptions.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      // Date sorting
      sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'razorpayOrderId') {
      // String sorting for order ID
      sortOptions.razorpayOrderId = sortOrder === 'asc' ? 1 : -1;
    } else {
      // Default sorting
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    console.log('🎯 SORT DEBUG: Applied sort options:', sortOptions, 'for sortBy:', sortBy, 'sortOrder:', sortOrder);
    console.log('🔍 SORT DEBUG: Query parameters received:', {
      sortBy, sortOrder, searchText, selectedType, selectedStatus, page, limit
    });
    
    // Debug logging for subscription filtering
    if (selectedType && selectedType.includes('Subscription')) {
      console.log('FILTER DEBUG: Final query for', selectedType, ':', JSON.stringify(query, null, 2));
      
      // Let's also see what actual documents exist with subscription fields
      const sampleDocs = await Donation.find({
        $or: [
          { subscriptionId: { $exists: true } },
          { method: { $exists: true } },
          { period: { $exists: true } },
          { razorpaySubscriptionId: { $exists: true } }
        ]
      }).limit(3).lean();
      
      console.log('FILTER DEBUG: Sample docs with subscription fields:', JSON.stringify(sampleDocs.map(doc => ({
        _id: doc._id,
        type: doc.type,
        method: doc.method,
        subscriptionId: doc.subscriptionId,
        period: doc.period,
        razorpaySubscriptionId: doc.razorpaySubscriptionId,
        name: doc.name
      })), null, 2));
    }
    
    // For exports, skip pagination
    if (exportAll) {
      const donations = await Donation.find(query).sort(sortOptions).lean();
      return {
        donations: formatDonations(donations),
        totalItems: donations.length,
        totalPages: 1,
        currentPage: 1
      };
    }
    
    // For normal views, apply pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [donations, totalItems] = await Promise.all([
      Donation.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Donation.countDocuments(query)
    ]);
    
    return {
      donations: formatDonations(donations),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    };
  },

  /**
 * Log a message sent to the donor
 */
async logMessageSent(id, messageData) {
  await connectToDatabase();
  
  const donation = await Donation.findById(id);
  
  if (!donation) {
    throw new Error(`Donation with ID ${id} not found`);
  }
  
  // If messageHistory doesn't exist, create it
  if (!donation.messageHistory) {
    donation.messageHistory = [];
  }
  
  // Add the new message to the history
  donation.messageHistory.push({
    message: messageData.message,
    timestamp: messageData.timestamp,
    status: messageData.status
  });
  
  // Save the updated donation
  await donation.save();
  
  return { success: true };
},
  
  /**
   * Get a single donation by ID
   */
  async getDonationById(id) {
    await connectToDatabase();
    
    const donation = await Donation.findOne({
      $or: [
        { _id: id },
        { razorpayOrderId: id }
      ]
    }).lean();
    
    if (!donation) {
      throw new Error(`Donation with ID ${id} not found`);
    }
    
    return formatDonation(donation);
  },
  
  /**
   * Create a new manual donation
   */
  async createManualDonation(data) {
    await connectToDatabase();
    
    // Format the data according to the schema
    const donationData = {
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      amount: data.amount,
      type: data.type,
      status: data.status || 'Completed',
      razorpayPaymentId: data.razorpayPaymentId || 'OFFLINE_PAYMENT',
      razorpayOrderId: data.razorpayOrderId || `MANUAL-${Date.now()}`,
      
      // Additional location details
      district: data.district || null,
      panchayat: data.location || null,
      locationType: data.locationType || 'district',
      address: data.address || null,
      
      createdAt: new Date()
    };
    
    // Create the donation
    const donation = new Donation(donationData);
    await donation.save();
    
    return formatDonation(donation.toObject());
  },
  
  /**
   * Update donation status
   */
  async updateDonationStatus(id, { status }) {
    await connectToDatabase();
    
    const donation = await Donation.findById(id);
    
    if (!donation) {
      throw new Error(`Donation with ID ${id} not found`);
    }
    
    donation.status = status;
    
    await donation.save();
    
    return formatDonation(donation.toObject());
  },

  /**
   * Delete a donation by ID
   */
  async deleteDonation(id) {
    await connectToDatabase();
    
    // Attempt to find and delete the donation
    const result = await Donation.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error(`Donation with ID ${id} not found`);
    }
    
    return { success: true };
  }
};

/**
 * Format a donation object to match UI expectations
 */
function formatDonation(donation) {
  // Format date for display
  let formattedDate = '';
  let displayDate = '';
  let createdAt = null;
  
  try {
    // Check if createdAt exists and is valid
    if (donation.createdAt && !isNaN(new Date(donation.createdAt).getTime())) {
      createdAt = new Date(donation.createdAt);
      formattedDate = createdAt.toISOString().split('T')[0];
      displayDate = createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      // Fallback for missing or invalid dates
      formattedDate = 'N/A';
      displayDate = 'N/A';
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    formattedDate = 'N/A';
    displayDate = 'N/A';
  }
  
  // Generate a donation ID format
  const donationId = donation.razorpayOrderId || 
                    `DON-${donation._id.toString().substr(-4).toUpperCase()}`;
  
  // Format amount with currency symbol
  let formattedAmount = 'N/A';
  try {
    if (donation.amount !== undefined && donation.amount !== null) {
      formattedAmount = `₹${parseFloat(donation.amount).toLocaleString('en-IN')}`;
    }
  } catch (error) {
    console.error('Error formatting amount:', error);
  }
  
  // Determine payment method
  let paymentMethod = 'Online Payment';
  if (donation.razorpayPaymentId === 'OFFLINE_PAYMENT') {
    paymentMethod = 'Cash';
  } else if (donation.razorpayPaymentId && donation.razorpayPaymentId.startsWith('CHECK-')) {
    paymentMethod = 'Check';
  } else if (donation.razorpayPaymentId && donation.razorpayPaymentId.startsWith('BANK-')) {
    paymentMethod = 'Bank Transfer';
  } else if (donation.razorpayPaymentId && donation.razorpayPaymentId.startsWith('UPI-')) {
    paymentMethod = 'UPI';
  } else if (donation.razorpayOrderId && donation.razorpayOrderId.startsWith('MANUAL-')) {
    paymentMethod = 'Manual Entry';
  }

  // Determine donation type with subscription handling
  let donationType = donation.type || 'General';
  
  // Check if this is a subscription donation - but exclude sponsorships
  // Only treat as subscription if it has subscription-related fields AND is not a sponsorship
  const isSponsorship = donationType.includes('Sponsor-') || donationType.startsWith('Sponsor');
  const hasSubscriptionFields = donation.subscriptionId || donation.method || donation.period;
  
  if (hasSubscriptionFields && !isSponsorship) {
    const subscriptionMethod = donation.method || 'manual'; // default to manual if not specified
    const baseType = donation.type || 'General';
    
    // Create subscription type display only for actual subscriptions
    if (baseType === 'General' || baseType === 'Subscription') {
      donationType = `Subscription-${subscriptionMethod === 'auto' ? 'Auto' : 'Manual'}`;
    } else {
      // For other types like Yatheem, Hafiz that are subscriptions
      donationType = `${baseType}-Subscription-${subscriptionMethod === 'auto' ? 'Auto' : 'Manual'}`;
    }
  }
  // If it's a sponsorship, keep the original type (Sponsor-Yatheem, Sponsor-Hafiz, etc.)
  
  return {
    id: donationId,
    _id: donation._id.toString(),
    donor: donation.name || 'Anonymous',
    amount: formattedAmount,
    type: donationType,
    status: donation.status || 'N/A',
    date: formattedDate,
    displayDate,
    email: donation.email || 'N/A',
    phone: donation.phone || 'N/A',
    transactionId: donation.razorpayPaymentId || 'N/A',
    receipt_generated: false, // You might want to track this in your schema
    paymentMethod: paymentMethod,
    
    // Detailed donor information
    donor_details: {
      name: donation.name || 'Anonymous',
      email: donation.email || 'N/A',
      phone: donation.phone || 'N/A',
      district: donation.district || 'N/A',
      location: donation.panchayat || donation.district || 'N/A',
      locationType: donation.locationType || 'district',
      address: donation.address || 'N/A',
      previousDonations: 0, // This would require a separate count query in practice
      totalAmount: '₹0' // This would require a separate sum query in practice
    },
    
    createdAtTimestamp: donation.createdAt ? donation.createdAt.getTime() : Date.now()
  };
}

/**
 * Format an array of donations
 */
function formatDonations(donations) {
  try {
    return donations.map(formatDonation);
  } catch (error) {
    console.error('Error formatting donations:', error);
    return [];
  }
}