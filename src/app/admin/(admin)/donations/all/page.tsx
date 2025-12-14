"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Sliders,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { handleExport } from "./exportFunctions";
import ExportDropdown from "@/components/ExportDropdown/ExportDropdown";
import { useSession } from "next-auth/react";
import NoAccess from "@/components/NoAccess";

// Define the Donation interface
interface Donation {
  id: string;
  _id: string;
  donor: string;
  email: string;
  phone: string;
  amount: string;
  type: string;
  status: string;
  date: string;
  displayDate: string;
  razorpayOrderId?: string;
  name?: string;
  createdAt?: string;
  createdAtTimestamp?: number;
  method?: string; // Added method field for type safety
}

// Define API response interface
interface DonationResponse {
  donations: Donation[];
  totalItems: number;
  totalPages: number;
}

// Utility function to format date and time
const formatDateTime = (donation: Donation) => {
  try {
    let date: Date;

    // Priority order: createdAtTimestamp > createdAt > date
    if (donation.createdAtTimestamp) {
      date = new Date(donation.createdAtTimestamp);
    } else if (donation.createdAt) {
      date = new Date(donation.createdAt);
    } else if (donation.date && donation.date !== "N/A") {
      date = new Date(donation.date);
    } else {
      return "N/A";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export default function AllDonationsPage() {
  const { data: session, status } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";
  const hasPermission =
    isSuperAdmin ||
    (session?.user as { permissions?: string[] })?.permissions?.includes(
      "donation_all"
    );

  // States with explicit types
  const [searchText, setSearchText] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage: number = 10;
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [displayedDonations, setDisplayedDonations] = useState<Donation[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [donationToDelete, setDonationToDelete] = useState<Donation | null>(
    null
  );

  // Ref to track previous filter values
  const prevFiltersRef = useRef({
    searchText: "",
    selectedType: "",
    selectedStatus: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "date",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Map UI sort fields to database fields
  const mapSortByToDbField = (uiField: string): string => {
    const mapping: { [key: string]: string } = {
      id: "razorpayOrderId",
      donor: "name",
      amount: "amount",
      date: "createdAt",
    };
    return mapping[uiField] || "createdAt";
  };

  // Memoized fetchDonations
  const fetchDonations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchText,
        type: selectedType,
        status: selectedStatus,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: mapSortByToDbField(sortBy),
        sortOrder,
      });

      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(
        `/api/donations/dashboard/donations?${params.toString()}`,
        {
          headers: {
            "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DonationResponse = await response.json();

      setDisplayedDonations(data.donations);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchText,
    selectedType,
    selectedStatus,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
  ]);

  // Debounced fetch for search text changes
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const isFilterChange =
      searchText !== prevFilters.searchText ||
      selectedType !== prevFilters.selectedType ||
      selectedStatus !== prevFilters.selectedStatus ||
      dateFrom !== prevFilters.dateFrom ||
      dateTo !== prevFilters.dateTo;

    // Reset page to 1 if filters changed
    if (isFilterChange && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    prevFiltersRef.current = {
      searchText,
      selectedType,
      selectedStatus,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    };

    const timeoutId = setTimeout(() => {
      fetchDonations();
    }, searchText ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [
    searchText,
    selectedType,
    selectedStatus,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    currentPage,
    fetchDonations,
  ]);

  if (status === "loading") return null;
  if (!hasPermission) return <NoAccess />;

  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "bg-gray-500/20 text-gray-500";
    let icon = <AlertCircle className="h-3 w-3 mr-1" />;

    if (status === "Completed") {
      bgColor = "bg-green-500/20 text-green-500";
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
    } else if (status === "Pending") {
      bgColor = "bg-amber-500/20 text-amber-500";
      icon = <Clock className="h-3 w-3 mr-1" />;
    } else if (status === "Failed") {
      bgColor = "bg-red-500/20 text-red-500";
      icon = <XCircle className="h-3 w-3 mr-1" />;
    }

    return (
      <span
        className={`px-2 py-1 rounded-full ${bgColor} flex items-center justify-center w-fit text-xs font-medium`}
      >
        {icon} {status}
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: string }) => {
    let bgColor = "bg-blue-500/20 text-blue-500";

    if (type === "Yatheem") {
      bgColor = "bg-purple-500/20 text-purple-500";
    } else if (type === "Hafiz") {
      bgColor = "bg-indigo-500/20 text-indigo-500";
    } else if (type === "Building") {
      bgColor = "bg-amber-500/20 text-amber-500";
    } else if (type === "Campaign") {
      bgColor = "bg-green-500/20 text-green-500";
    } else if (type === "Institution") {
      bgColor = "bg-red-500/20 text-red-500";
    } else if (type === "Box") {
      bgColor = "bg-cyan-500/20 text-cyan-500";
    } else if (type === "Sponsor-Yatheem") {
      bgColor = "bg-violet-500/20 text-violet-500";
    } else if (type === "Sponsor-Hafiz") {
      bgColor = "bg-fuchsia-500/20 text-fuchsia-500";
    } else if (type === "Subscription-Auto") {
      bgColor = "bg-emerald-500/20 text-emerald-500";
    } else if (type === "Subscription-Manual") {
      bgColor = "bg-teal-500/20 text-teal-500";
    } else if (type.includes("Subscription")) {
      bgColor = "bg-pink-500/20 text-pink-500";
    }

    return (
      <span className={`px-2 py-1 rounded-full ${bgColor} text-xs font-medium`}>
        {type}
      </span>
    );
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 text-emerald-500" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 text-emerald-500" />
    );
  };

  const getSortHeaderClass = (column: string) => {
    const baseClass =
      "flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors";
    return sortBy === column
      ? `${baseClass} text-emerald-600 dark:text-emerald-400 font-semibold`
      : baseClass;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (start === 2) end = Math.min(4, totalPages - 1);
      if (end === totalPages - 1) start = Math.max(2, totalPages - 3);

      if (start > 2) pages.push("ellipsis1");

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push("ellipsis2");
      pages.push(totalPages);
    }

    return pages;
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  const handleResetFilters = () => {
    setSearchText("");
    setSelectedType("");
    setSelectedStatus("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleResetSort = () => {
    setSortBy("date");
    setSortOrder("desc");
  };

  const handleResetAll = () => {
    handleResetFilters();
    handleResetSort();
  };

  const handleExportWithAllData = async (type: "csv" | "pdf") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchText,
        type: selectedType,
        status: selectedStatus,
        exportAll: "true",
        sortBy: mapSortByToDbField(sortBy),
        sortOrder,
      });

      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(
        `/api/donations/dashboard/donations?${params.toString()}`,
        {
          headers: {
            "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch donations for export");
      }

      const data: DonationResponse = await response.json();
      handleExport(data.donations, type);
    } catch (error) {
      console.error("Error exporting donations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchDonations();
  };

  const handleDeleteClick = (donation: Donation) => {
    setDonationToDelete(donation);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!donationToDelete) return;

    setIsDeleting(true);
    setDeletingId(donationToDelete._id);

    try {
      const response = await fetch(
        `/api/donations/dashboard/donations/${donationToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete donation");
      }

      fetchDonations();
      setDeleteConfirmOpen(false);
      setDonationToDelete(null);
    } catch (error) {
      console.error("Error deleting donation:", error);
      alert("Failed to delete the donation. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDonationToDelete(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">
            All Donations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage all donations across your organization
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            href="/admin/donations/create"
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-300 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Donation
          </Link>
          <ExportDropdown
            onExport={(type) => handleExportWithAllData(type)}
            disabled={isLoading || displayedDonations.length === 0}
          />
          <button
            className="px-3 py-2 bg-white/10 text-black dark:text-white backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 text-sm font-medium hover:bg-white/20 transition-all duration-300 flex items-center"
            onClick={refreshData}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            className="px-3 py-2 bg-white/10 text-black dark:text-white dark:border-white/20 border-gray-600/20 backdrop-blur-md rounded-lg border text-sm font-medium hover:bg-white/20 transition-all duration-300 flex items-center sm:hidden"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Sliders className="h-4 w-4 mr-2" /> Filters
          </button>
        </div>
      </div>

      {/* Main content section */}
      <div className="bg-transparent md:bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-none md:border-white/20 shadow-xl">
        {/* Desktop filters */}
        <div className="hidden md:flex flex-col md:flex-row items-start md:items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by donor name or ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
            >
              <option value="">All Types</option>
              <option value="General">General</option>
              <option value="Yatheem">Yatheem</option>
              <option value="Hafiz">Hafiz</option>
              <option value="Building">Building</option>
              <option value="Campaign">Campaign</option>
              <option value="Institution">Institution</option>
              <option value="Box">Box</option>
              <option value="Sponsor-Yatheem">Sponsor-Yatheem</option>
              <option value="Sponsor-Hafiz">Sponsor-Hafiz</option>
              <option value="Subscription-Auto">Subscription-Auto</option>
              <option value="Subscription-Manual">Subscription-Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 h-10 bg-white/10 text-gray-700 dark:text-gray-300 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 text-sm font-medium hover:bg-white/20 transition-all duration-300 flex items-center"
              onClick={handleApplyFilters}
            >
              <Filter className="h-4 w-4 mr-2" /> Apply
            </button>

            <button
              className="px-4 py-2 h-10 bg-white/10 text-gray-700 dark:text-gray-300 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 text-sm font-medium hover:bg-white/20 transition-all duration-300 flex items-center"
              onClick={handleResetFilters}
            >
              <X className="h-4 w-4 mr-2" /> Reset
            </button>
          </div>
        </div>

        {/* Mobile search and filter toggle */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by donor or ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Mobile filters panel */}
        {showMobileFilters && (
          <div className="md:hidden bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/30 animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-800 dark:text-white">
                Filters
              </h3>
              <button onClick={() => setShowMobileFilters(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                >
                  <option value="">All Types</option>
                  <option value="General">General</option>
                  <option value="Yatheem">Yatheem</option>
                  <option value="Hafiz">Hafiz</option>
                  <option value="Building">Building</option>
                  <option value="Campaign">Campaign</option>
                  <option value="Institution">Institution</option>
                  <option value="Box">Box</option>
                  <option value="Sponsor-Yatheem">Sponsor-Yatheem</option>
                  <option value="Sponsor-Hafiz">Sponsor-Hafiz</option>
                  <option value="Subscription-Auto">Subscription-Auto</option>
                  <option value="Subscription-Manual">Subscription-Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="pt-3 border-t border-white/20">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Options
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200 text-sm"
                    >
                      <option value="date">Date & Time</option>
                      <option value="donor">Donor Name</option>
                      <option value="amount">Amount</option>
                      <option value="id">ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as "asc" | "desc")
                      }
                      className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200 text-sm"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-300"
                >
                  Apply
                </button>
                <button
                  onClick={handleResetAll}
                  className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-sm font-medium hover:bg-white/20 transition-all duration-300"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applied filters tags */}
        {(selectedType || selectedStatus || dateFrom || dateTo) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedType && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs">
                Type: {selectedType}
                <button
                  onClick={() => setSelectedType("")}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {selectedStatus && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus("")}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {dateFrom && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs">
                From: {new Date(dateFrom).toLocaleDateString()}
                <button
                  onClick={() => setDateFrom("")}
                  className="ml-1 hover:text-amber-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {dateTo && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs">
                To: {new Date(dateTo).toLocaleDateString()}
                <button
                  onClick={() => setDateTo("")}
                  className="ml-1 hover:text-amber-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={handleResetAll}
              className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 text-xs hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Sort indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="mr-2">Sort by:</span>
            <div className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs font-medium">
              {sortBy === "id" && "ID"}
              {sortBy === "donor" && "Donor Name"}
              {sortBy === "amount" && "Amount"}
              {sortBy === "date" && "Date & Time"}
              {sortOrder === "asc" ? (
                <ChevronUp className="ml-1 h-3 w-3" />
              ) : (
                <ChevronDown className="ml-1 h-3 w-3" />
              )}
              <span className="ml-1">
                ({sortOrder === "asc" ? "Ascending" : "Descending"})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Quick sort:
            </span>
            <button
              onClick={() => {
                setSortBy("date");
                setSortOrder("desc");
              }}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                sortBy === "date" && sortOrder === "desc"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Latest First
            </button>
            <button
              onClick={() => {
                setSortBy("amount");
                setSortOrder("desc");
              }}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                sortBy === "amount" && sortOrder === "desc"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Highest Amount
            </button>
            <button
              onClick={() => {
                setSortBy("donor");
                setSortOrder("asc");
              }}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                sortBy === "donor" && sortOrder === "asc"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              A-Z Name
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="relative w-12 h-12">
              <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && displayedDonations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No donations found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-300"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Donations Table - Desktop View */}
        {!isLoading && displayedDonations.length > 0 && (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="hidden md:table w-full text-left border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider rounded-tl-lg">
                    <div
                      className={getSortHeaderClass("id")}
                      onClick={() => toggleSort("id")}
                    >
                      ID
                      {getSortIcon("id")}
                    </div>
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div
                      className={getSortHeaderClass("donor")}
                      onClick={() => toggleSort("donor")}
                    >
                      Donor Name
                      {getSortIcon("donor")}
                    </div>
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div
                      className={getSortHeaderClass("amount")}
                      onClick={() => toggleSort("amount")}
                    >
                      Amount
                      {getSortIcon("amount")}
                    </div>
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div
                      className={getSortHeaderClass("date")}
                      onClick={() => toggleSort("date")}
                    >
                      Date & Time
                      {getSortIcon("date")}
                    </div>
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedDonations.map((donation, index) => (
                  <tr
                    key={donation._id}
                    className={`hover:bg-white/5 dark:hover:bg-gray-800/50 backdrop-blur-md transition-all group ${
                      index % 2 === 0
                        ? "bg-white/2"
                        : "bg-white/5 dark:bg-gray-800/20"
                    }`}
                  >
                    <td className="p-3 text-sm font-medium text-gray-900 dark:text-white border-b border-white/10">
                      {donation.id}
                    </td>
                    <td className="p-3 border-b border-white/10">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {donation.donor}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {donation.email !== "N/A"
                          ? donation.email
                          : donation.phone}
                      </div>
                    </td>
                    <td className="p-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 border-b border-white/10">
                      {donation.amount}
                    </td>
                    <td className="p-3 border-b border-white/10">
                      <TypeBadge type={donation.type} />
                    </td>
                    <td className="p-3 border-b border-white/10">
                      <StatusBadge status={donation.status} />
                    </td>
                    <td className="p-3 text-sm text-gray-500 dark:text-gray-400 border-b border-white/10">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(donation)}
                      </div>
                    </td>
                    <td className="p-3 border-b border-white/10">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <Link
                          href={`/admin/donations/detail?id=${donation._id}`}
                          className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/donations/status?id=${donation._id}`}
                          className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(donation)}
                          className="p-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                          disabled={isDeleting && deletingId === donation._id}
                        >
                          <Trash2
                            className={`h-4 w-4 ${
                              isDeleting && deletingId === donation._id
                                ? "animate-pulse"
                                : ""
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {displayedDonations.map((donation) => (
                <div
                  key={donation._id}
                  className="p-4 bg-white/5 dark:bg-gray-800/20 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                        {donation.donor}
                      </div>
                      <div className="text-xs text-gray-500">{donation.id}</div>
                    </div>
                    <StatusBadge status={donation.status} />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Amount
                      </div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {donation.amount}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Type
                      </div>
                      <TypeBadge type={donation.type} />
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Date & Time
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(donation)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <Link
                      href={`/admin/donations/detail?id=${donation._id}`}
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/admin/donations/status?id=${donation._id}`}
                      className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(donation)}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                      disabled={isDeleting && deletingId === donation._id}
                    >
                      <Trash2
                        className={`h-4 w-4 ${
                          isDeleting && deletingId === donation._id
                            ? "animate-pulse"
                            : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalItems > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> entries
            </div>
            <div className="flex items-center space-x-1 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                    : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {getPageNumbers().map((page, index) =>
                page === "ellipsis1" || page === "ellipsis2" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-1 text-gray-500 dark:text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${page}`}
                    onClick={() => handlePageChange(page as number)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                      currentPage === page
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                    : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && donationToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete the donation{" "}
              <span className="font-semibold">{donationToDelete.id}</span> from{" "}
              <span className="font-semibold">{donationToDelete.donor}</span>?
              <br />
              <br />
              <span className="text-red-600 dark:text-red-400 text-sm">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-300 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete Donation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}