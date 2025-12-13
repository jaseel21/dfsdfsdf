"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  Search, 
  Download, 
  RefreshCw, 
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Award,
  Star,
  Medal,
  Crown,
  Eye,
  ChevronDown,
  X,
  ArrowUpDown
} from "lucide-react";
import NoAccess from "@/components/NoAccess";

// Type definitions
interface Donor {
  rank: number;
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  panchayat: string;
  totalAmount: number;
  donationCount: number;
  averageAmount: number;
  firstDonation: string;
  lastDonation: string;
  donorSince: string;
  daysSinceFirstDonation: number;
  donations: Array<{
    amount: number;
    type: string;
    date: string;
    status: string;
  }>;
}

interface LocationStat {
  _id: string;
  panchayats: Array<{
    name: string;
    uniqueDonors: number;
    totalAmount: number;
    totalDonations: number;
  }>;
  districtTotal: number;
  districtDonors: number;
  districtDonations: number;
}

interface OverallStats {
  totalDonors: number;
  totalAmount: number;
  totalDonations: number;
  averageDonationAmount: number;
}

export default function DonorManagementPage() {
  const { data: session, status } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";
  const hasPermission = isSuperAdmin || (session?.user as { permissions?: string[] })?.permissions?.includes("donation_management");
  
  const [donors, setDonors] = useState<Donor[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStat[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalDonors: 0,
    totalAmount: 0,
    totalDonations: 0,
    averageDonationAmount: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDonors: 0,
    limit: 25,
    hasNextPage: false,
    hasPrevPage: false,
    startIndex: 1,
    endIndex: 1
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedPanchayat, setSelectedPanchayat] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("totalAmount");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [viewMode, setViewMode] = useState<string>("leaderboard"); // leaderboard, table, location
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showDonorModal, setShowDonorModal] = useState<boolean>(false);
  const [showLocationDonorsModal, setShowLocationDonorsModal] = useState<boolean>(false);
  const [locationDonors, setLocationDonors] = useState<Donor[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    district: string;
    panchayat?: string;
    totalDonors: number;
    totalAmount: number;
    totalDonations: number;
  } | null>(null);
  const [locationDonorsPagination, setLocationDonorsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDonors: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
    startIndex: 1,
    endIndex: 1
  });
  const [isLoadingLocationDonors, setIsLoadingLocationDonors] = useState<boolean>(false);

  // Fetch donor analytics
  const fetchDonorAnalytics = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        district: selectedDistrict,
        panchayat: selectedPanchayat,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/donations/donor-analytics?${params}`, {
        headers: {
          'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
        }
      });
      const data = await response.json();

      console.log("API Response:", data); // Debug logging

      if (data.success) {
        setDonors(data.donors || []);
        setLocationStats(data.locationStats || []);
        setOverallStats(data.overallStats || {
          totalDonors: 0,
          totalAmount: 0,
          totalDonations: 0,
          averageDonationAmount: 0
        });
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalDonors: 0,
          limit: 25,
          hasNextPage: false,
          hasPrevPage: false,
          startIndex: 1,
          endIndex: 1
        });
      } else {
        console.error("Failed to fetch donor analytics:", data.message);
        setDonors([]);
        setLocationStats([]);
        setOverallStats({
          totalDonors: 0,
          totalAmount: 0,
          totalDonations: 0,
          averageDonationAmount: 0
        });
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalDonors: 0,
          limit: 25,
          hasNextPage: false,
          hasPrevPage: false,
          startIndex: 1,
          endIndex: 1
        });
      }
    } catch (error) {
      console.error("Error fetching donor analytics:", error);
      setDonors([]);
      setLocationStats([]);
      setOverallStats({
        totalDonors: 0,
        totalAmount: 0,
        totalDonations: 0,
        averageDonationAmount: 0
      });
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalDonors: 0,
        limit: 25,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 1,
        endIndex: 1
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedDistrict, selectedPanchayat, sortBy, sortOrder, pagination.limit]);

  // Fetch donors by location
  const fetchLocationDonors = useCallback(async (district: string, panchayat?: string, page = 1) => {
    setIsLoadingLocationDonors(true);
    try {
      const params = new URLSearchParams({
        district: district,
        page: page.toString(),
        limit: locationDonorsPagination.limit.toString(),
        sortBy: "totalAmount",
        sortOrder: "desc"
      });

      if (panchayat && panchayat !== "all") {
        params.append("panchayat", panchayat);
      }

      const response = await fetch(`/api/donations/donors-by-location?${params}`, {
        headers: {
          'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
        }
      });
      const data = await response.json();

      console.log("Location donors API Response:", data); // Debug logging

      if (data.success) {
        setLocationDonors(data.donors || []);
        setLocationDonorsPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalDonors: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
          startIndex: 1,
          endIndex: 1
        });
        setSelectedLocation({
          district: data.locationInfo.district,
          panchayat: data.locationInfo.panchayat !== "All Panchayats" ? data.locationInfo.panchayat : undefined,
          totalDonors: data.locationInfo.totalDonors,
          totalAmount: data.locationInfo.totalAmount,
          totalDonations: data.locationInfo.totalDonations
        });
      } else {
        console.error("Failed to fetch location donors:", data.message);
        setLocationDonors([]);
        setLocationDonorsPagination({
          currentPage: 1,
          totalPages: 1,
          totalDonors: 0,
          limit: 25,
          hasNextPage: false,
          hasPrevPage: false,
          startIndex: 1,
          endIndex: 1
        });
      }
    } catch (error) {
      console.error("Error fetching location donors:", error);
      setLocationDonors([]);
      setLocationDonorsPagination({
        currentPage: 1,
        totalPages: 1,
        totalDonors: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 1,
        endIndex: 1
      });
    } finally {
      setIsLoadingLocationDonors(false);
    }
  }, [locationDonorsPagination.limit]);

  // Handle location click
  const handleLocationClick = (district: string, panchayat?: string) => {
    fetchLocationDonors(district, panchayat);
    setShowLocationDonorsModal(true);
  };

  // Location donors pagination handlers
  const handleLocationPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= locationDonorsPagination.totalPages && selectedLocation) {
      fetchLocationDonors(selectedLocation.district, selectedLocation.panchayat, newPage);
    }
  };

  const handleLocationLimitChange = (newLimit: number) => {
    setLocationDonorsPagination(prev => ({ ...prev, limit: newLimit }));
    if (selectedLocation) {
      fetchLocationDonors(selectedLocation.district, selectedLocation.panchayat, 1); // Reset to page 1 when changing limit
    }
  };

  useEffect(() => {
    fetchDonorAnalytics(1); // Always start from page 1 when filters change
  }, [fetchDonorAnalytics, searchTerm, selectedDistrict, selectedPanchayat, sortBy, sortOrder]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchDonorAnalytics(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit }));
    fetchDonorAnalytics(1); // Reset to page 1 when changing limit
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  // Get rank icon
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <Star className="h-5 w-5 text-blue-500" />;
  };

  // Get available districts and panchayats
  const districts = [...new Set(locationStats.map(stat => stat._id).filter(Boolean))];
  const panchayats = selectedDistrict === "all" ? 
    [] : 
    locationStats.find(stat => stat._id === selectedDistrict)?.panchayats?.map(p => p.name) || [];

  // Handle sort change
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDistrict("all");
    setSelectedPanchayat("all");
    setSortBy("totalAmount");
    setSortOrder("desc");
  };

  // Export data
  const exportData = () => {
    if (donors.length === 0) return;
    
    const csvData = donors.map(donor => ({
      Rank: donor.rank,
      Name: donor.name,
      Phone: donor.phone,
      Email: donor.email,
      District: donor.district,
      Panchayat: donor.panchayat,
      "Total Amount": donor.totalAmount,
      "Donation Count": donor.donationCount,
      "Average Amount": donor.averageAmount,
      "First Donation": formatDate(donor.firstDonation),
      "Last Donation": formatDate(donor.lastDonation)
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donor-leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Permission check
  if (status === "loading") return null;
  if (!hasPermission) return <NoAccess />;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-1">
            <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
            Donor Management
            <span className="ml-3 text-sm font-normal bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 py-0.5 px-2 rounded-full">
              {donors.length} Donors
            </span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track and analyze donor contributions with comprehensive leaderboards
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchDonorAnalytics(pagination.currentPage)}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-sm font-medium hover:bg-white/20 transition-all duration-300 text-gray-700 dark:text-gray-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportData}
            disabled={isLoading || donors.length === 0}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/10 rounded-full -mr-8 -mt-8"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donors</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {overallStats.totalDonors?.toLocaleString() || 0}
              </h3>
            </div>
            <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              <Users className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-green-500/10 rounded-full -mr-8 -mt-8"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {formatCurrency(overallStats.totalAmount || 0)}
              </h3>
            </div>
            <span className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/10 rounded-full -mr-8 -mt-8"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {overallStats.totalDonations?.toLocaleString() || 0}
              </h3>
            </div>
            <span className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-yellow-500/10 rounded-full -mr-8 -mt-8"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Donation</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {formatCurrency(overallStats.averageDonationAmount || 0)}
              </h3>
            </div>
            <span className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full">
              <Trophy className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 p-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
          {[
            { key: "leaderboard", label: "Leaderboard", icon: Trophy },
            { key: "table", label: "Detailed View", icon: Users },
            { key: "location", label: "Location Stats", icon: MapPin }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                viewMode === key
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-gray-200"
            />
          </div>

          {/* District Filter */}
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedPanchayat("all");
              }}
              className="appearance-none pl-3 pr-8 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-gray-200"
            >
              <option value="all">All Districts</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Panchayat Filter */}
          {selectedDistrict !== "all" && (
            <div className="relative">
              <select
                value={selectedPanchayat}
                onChange={(e) => setSelectedPanchayat(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-gray-200"
              >
                <option value="all">All Panchayats</option>
                {panchayats.map((panchayat) => (
                  <option key={panchayat} value={panchayat}>
                    {panchayat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Sort Options */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="appearance-none pl-3 pr-8 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-gray-200"
            >
              <option value="totalAmount-desc">Highest Amount</option>
              <option value="donationCount-desc">Most Donations</option>
              <option value="averageAmount-desc">Highest Average</option>
              <option value="lastDonation-desc">Recent Donors</option>
              <option value="name-asc">Name A-Z</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedDistrict !== "all" || selectedPanchayat !== "all" || sortBy !== "totalAmount" || sortOrder !== "desc") && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800/50 transition-all duration-300 flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Pagination Controls - Top */}
      {!isLoading && (viewMode === "leaderboard" || viewMode === "table") && pagination.totalPages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="relative w-12 h-12">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {!isLoading && (
        <>
          {viewMode === "leaderboard" && (
            <DonorLeaderboard 
              donors={donors} 
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getRankIcon={getRankIcon}
              setSelectedDonor={setSelectedDonor}
              setShowDonorModal={setShowDonorModal}
            />
          )}

          {viewMode === "table" && (
            <DonorTable 
              donors={donors} 
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getRankIcon={getRankIcon}
              handleSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
              setSelectedDonor={setSelectedDonor}
              setShowDonorModal={setShowDonorModal}
            />
          )}

          {viewMode === "location" && (
            <LocationStats 
              locationStats={locationStats} 
              formatCurrency={formatCurrency}
              onLocationClick={handleLocationClick}
            />
          )}

          {/* Spacing before pagination */}
          {(viewMode === "leaderboard" || viewMode === "table") && (
            <div className="mt-8"></div>
          )}
        </>
      )}

      {/* Pagination Controls - Bottom */}
      {!isLoading && (viewMode === "leaderboard" || viewMode === "table") && pagination.totalPages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Donor Detail Modal */}
      {showDonorModal && selectedDonor && (
        <DonorDetailModal
          donor={selectedDonor}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getRankIcon={getRankIcon}
          onClose={() => {
            setShowDonorModal(false);
            setSelectedDonor(null);
          }}
        />
      )}

      {/* Location Donors Modal */}
      {showLocationDonorsModal && selectedLocation && (
        <LocationDonorsModal
          location={selectedLocation}
          donors={locationDonors}
          pagination={locationDonorsPagination}
          isLoading={isLoadingLocationDonors}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getRankIcon={getRankIcon}
          onClose={() => {
            setShowLocationDonorsModal(false);
            setSelectedLocation(null);
            setLocationDonors([]);
          }}
          onPageChange={handleLocationPageChange}
          onLimitChange={handleLocationLimitChange}
          onDonorClick={(donor: Donor) => {
            setSelectedDonor(donor);
            setShowDonorModal(true);
          }}
        />
      )}
    </div>
  );
}

// Component Props Interfaces
interface DonorLeaderboardProps {
  donors: Donor[];
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getRankIcon: (rank: number) => React.JSX.Element;
  setSelectedDonor: (donor: Donor) => void;
  setShowDonorModal: (show: boolean) => void;
}

interface DonorTableProps {
  donors: Donor[];
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getRankIcon: (rank: number) => React.JSX.Element;
  handleSort: (field: string) => void;
  sortBy: string;
  sortOrder: string;
  setSelectedDonor: (donor: Donor) => void;
  setShowDonorModal: (show: boolean) => void;
}

interface LocationStatsProps {
  locationStats: LocationStat[];
  formatCurrency: (amount: number) => string;
  onLocationClick: (district: string, panchayat?: string) => void;
}

interface DonorDetailModalProps {
  donor: Donor;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getRankIcon: (rank: number) => React.JSX.Element;
  onClose: () => void;
}

// Donor Leaderboard Component
function DonorLeaderboard({ donors, formatCurrency, formatDate, getRankIcon, setSelectedDonor, setShowDonorModal }: DonorLeaderboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {donors.map((donor) => (
        <div
          key={donor.id}
          className={`relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer ${
            donor.rank <= 3 ? "ring-2 ring-yellow-400/50 bg-gradient-to-br from-yellow-50/10 to-yellow-100/10" : ""
          }`}
          onClick={() => {
            setSelectedDonor(donor);
            setShowDonorModal(true);
          }}
        >
          {/* Rank Badge */}
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
            #{donor.rank}
          </div>

          {/* Rank Icon */}
          <div className="flex items-center justify-center mb-4">
            {getRankIcon(donor.rank)}
          </div>

          {/* Donor Info */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              {donor.name}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-center">
                <Phone className="h-4 w-4 mr-2" />
                {donor.phone}
              </div>
              
              {donor.email && (
                <div className="flex items-center justify-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {donor.email}
                </div>
              )}
              
              <div className="flex items-center justify-center">
                <MapPin className="h-4 w-4 mr-2" />
                {donor.district}, {donor.panchayat}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 p-4 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {formatCurrency(donor.totalAmount)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {donor.donationCount} donations • Avg {formatCurrency(donor.averageAmount)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Last donation: {formatDate(donor.lastDonation)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Donor Table Component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DonorTable({ donors, formatCurrency, formatDate, getRankIcon, handleSort, sortBy: _sortBy, sortOrder: _sortOrder, setSelectedDonor, setShowDonorModal }: DonorTableProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-md border-b border-white/20">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rank
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Donor
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Location
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                onClick={() => handleSort("totalAmount")}
              >
                <div className="flex items-center">
                  Total Amount
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                onClick={() => handleSort("donationCount")}
              >
                <div className="flex items-center">
                  Donations
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                onClick={() => handleSort("averageAmount")}
              >
                <div className="flex items-center">
                  Average
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                onClick={() => handleSort("lastDonation")}
              >
                <div className="flex items-center">
                  Last Donation
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/30 dark:divide-gray-600/30">
            {donors.map((donor) => (
              <tr 
                key={donor.id}
                className="hover:bg-white/5 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {donor.rank <= 3 ? getRankIcon(donor.rank) : (
                      <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                        #{donor.rank}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {donor.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center mb-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {donor.phone}
                    </div>
                    {donor.email && (
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {donor.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>{donor.district}</div>
                    <div className="text-xs">{donor.panchayat}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(donor.totalAmount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    {donor.donationCount}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(donor.averageAmount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(donor.lastDonation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedDonor(donor);
                      setShowDonorModal(true);
                    }}
                    className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Location Stats Component
function LocationStats({ locationStats, formatCurrency, onLocationClick }: LocationStatsProps) {
  return (
    <div className="space-y-6">
      {locationStats.map((district) => (
        <div 
          key={district._id}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6"
        >
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
            onClick={() => onLocationClick(district._id)}
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-500" />
              {district._id}
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                Click to view donors
              </span>
            </h3>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(district.districtTotal)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {district.districtDonors} donors • {district.districtDonations} donations
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {district.panchayats.map((panchayat) => (
              <div 
                key={panchayat.name}
                className="bg-white/10 rounded-lg p-4 border border-white/10 cursor-pointer hover:bg-white/15 transition-colors"
                onClick={() => onLocationClick(district._id, panchayat.name)}
              >
                <h4 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center justify-between">
                  {panchayat.name}
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                    View donors
                  </span>
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(panchayat.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Donors:</span>
                    <span className="text-gray-800 dark:text-white">
                      {panchayat.uniqueDonors}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Donations:</span>
                    <span className="text-gray-800 dark:text-white">
                      {panchayat.totalDonations}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Donor Detail Modal Component
function DonorDetailModal({ donor, formatCurrency, formatDate, getRankIcon, onClose }: DonorDetailModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] p-4 overflow-y-auto"
      style={{ zIndex: 9999 }}
    >
      <div className="min-h-full flex items-center justify-center py-8">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-2xl max-h-[calc(100vh-4rem)] flex flex-col">
          <div className="p-6 border-b border-white/20 flex-shrink-0">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  {getRankIcon(donor.rank)}
                  <span className="ml-2">{donor.name}</span>
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                    Rank #{donor.rank}
                    </span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Donor since {formatDate(donor.firstDonation)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-lg lg:text-2xl font-bold text-green-600 dark:text-green-400 truncate">
                {formatCurrency(donor.totalAmount)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Amount</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-lg lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {donor.donationCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Donations</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-lg lg:text-2xl font-bold text-purple-600 dark:text-purple-400 truncate">
                {formatCurrency(donor.averageAmount)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Average</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-lg lg:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Math.ceil((new Date().getTime() - new Date(donor.firstDonation).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Days Active</div>
            </div>
          </div>

          {/* Contact & Location Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Contact Information
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-800 dark:text-white truncate">{donor.phone}</span>
                </div>
                {donor.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-800 dark:text-white truncate">{donor.email}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Location
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-800 dark:text-white truncate">{donor.district}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 ml-6 truncate">
                  {donor.panchayat}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Donations */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Recent Donations ({donor.donations.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {donor.donations.slice(0, 10).map((donation, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-3 bg-white/10 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      {formatCurrency(donation.amount)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {donation.type} • {formatDate(donation.date)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    donation.status === 'Completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {donation.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// Pagination Controls Component
interface PaginationControlsProps {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDonors: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    startIndex: number;
    endIndex: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function PaginationControls({ pagination, onPageChange, onLimitChange }: PaginationControlsProps) {
  const getPageNumbers = () => {
    const pages = [];
    const { currentPage, totalPages } = pagination;
    
    // Always show first page
    if (totalPages > 0) pages.push(1);
    
    // Show ellipsis if there's gap
    if (currentPage > 4) pages.push("...");
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    // Show ellipsis if there's gap
    if (currentPage < totalPages - 3) pages.push("...");
    
    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages);
    
    return pages;
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Page Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalDonors} donors
        </div>

        {/* Page Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-gray-700 dark:text-gray-200 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
                disabled={page === "..." || page === pagination.currentPage}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                  page === pagination.currentPage
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                    : page === "..."
                    ? "text-gray-500 cursor-default"
                    : "bg-white/10 border border-white/20 text-gray-700 dark:text-gray-200 hover:bg-white/20"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-gray-700 dark:text-gray-200 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>

        {/* Items per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="appearance-none pl-3 pr-8 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-gray-200 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
        </div>
      </div>
    </div>
  );
}

// Location Donors Modal Component
interface LocationDonorsModalProps {
  location: {
    district: string;
    panchayat?: string;
    totalDonors: number;
    totalAmount: number;
    totalDonations: number;
  };
  donors: Donor[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDonors: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    startIndex: number;
    endIndex: number;
  };
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getRankIcon: (rank: number) => React.JSX.Element;
  onClose: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onDonorClick: (donor: Donor) => void;
}

function LocationDonorsModal({ 
  location, 
  donors, 
  pagination, 
  isLoading, 
  formatCurrency, 
  formatDate, 
  getRankIcon, 
  onClose, 
  onPageChange, 
  onLimitChange, 
  onDonorClick 
}: LocationDonorsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center py-12">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-6xl max-h-[75vh] flex flex-col">
          {/* Fixed Header */}
          <div className="p-6 border-b border-white/20 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <MapPin className="h-6 w-6 mr-2 text-blue-500" />
                  Donors from {location.district}
                  {location.panchayat && (
                    <span className="ml-2 text-lg font-normal text-gray-600 dark:text-gray-400">
                      - {location.panchayat}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {location.totalDonors} donors
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {formatCurrency(location.totalAmount)}
                  </span>
                  <span className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {location.totalDonations} donations
                  </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Pagination Controls - Top */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="mb-4">
              <PaginationControls
                pagination={pagination}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
              />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="relative w-12 h-12">
                <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
              </div>
            </div>
          )}

          {/* Donors List */}
          {!isLoading && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-md border-b border-white/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Donor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Donations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Donation
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/30 dark:divide-gray-600/30">
                    {donors.map((donor) => (
                      <tr 
                        key={donor.id}
                        className="hover:bg-white/5 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {donor.rank <= 3 ? getRankIcon(donor.rank) : (
                              <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                                #{donor.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {donor.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center mb-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {donor.phone}
                            </div>
                            {donor.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {donor.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(donor.totalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {donor.donationCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(donor.lastDonation)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => onDonorClick(donor)}
                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No donors message */}
          {!isLoading && donors.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                No donors found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No donors found for this location.
              </p>
            </div>
          )}

          {/* Pagination Controls - Bottom */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                pagination={pagination}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
