"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Trash2, ArrowLeft, Loader2, UserPlus, Users,
  X, Phone, MapPin, School, GraduationCap,
  CheckCircle, XCircle, Eye
} from "lucide-react";
import Link from "next/link";

interface Yatheem {
  _id: string;
  name: string;
  phone: string;
  place: string;
  class: string;
  school: string;
  status: string;
  sponsorId: {
    _id: string;
    name: string;
    phone: string;
    selectedAmount: number;
    paidAmount: number;
  } | null;
}

interface Sponsor {
  _id: string;
  name: string;
  phone: string;
  type: string;
  selectedAmount?: number;
  paidAmount?: number;
  amount?: number;
  yatheemId?: string;
}

export default function ProfessionalYatheemList() {
  const [yatheem, setYatheem] = useState<Yatheem[]>([]);
  const [filteredYatheem, setFilteredYatheem] = useState<Yatheem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "unassigned">("all");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    place: "",
    class: "",
    school: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedYatheemId, setSelectedYatheemId] = useState<string | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [searchSponsor, setSearchSponsor] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");


  useEffect(() => {
    fetchYatheem();
  }, []);

  useEffect(() => {
    let filtered = yatheem;

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(
        (y) =>
          y.name.toLowerCase().includes(searchText.toLowerCase()) ||
          y.phone.includes(searchText) ||
          y.place.toLowerCase().includes(searchText.toLowerCase()) ||
          y.school.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus === "assigned") {
      filtered = filtered.filter((y) => y.sponsorId !== null);
    } else if (filterStatus === "unassigned") {
      filtered = filtered.filter((y) => y.sponsorId === null);
    }

    setFilteredYatheem(filtered);
  }, [searchText, filterStatus, yatheem]);

  useEffect(() => {
    if (showAssignModal && selectedYatheemId) {
      fetchSponsors();
    }
  }, [showAssignModal, selectedYatheemId]);

  const fetchYatheem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/yatheem", {
        headers: {
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch yatheem");
      const data = await response.json();
      setYatheem(data);
      setFilteredYatheem(data);
    } catch (error) {
      console.error("Error fetching yatheem:", error);
      setError("Failed to load yatheem data. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSponsors = async () => {
    try {
      const response = await fetch("/api/admin/sponsorships?type=Sponsor-Yatheem", {
        headers: {
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch sponsors");
      const data = await response.json();
      setSponsors(data);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      setError("Failed to load sponsors. Please try again.");
    }
  };

  const handleAddYatheem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.place || !formData.class || !formData.school) {
      setError("Please fill in all fields.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/yatheem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to add yatheem");
      await fetchYatheem();
      setShowAddForm(false);
      setFormData({ name: "", phone: "", place: "", class: "", school: "" });
    } catch (error) {
      console.error("Error adding yatheem:", error);
      setError("Failed to add yatheem. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this yatheem? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/yatheem/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });
      if (!response.ok) throw new Error("Failed to delete yatheem");
      await fetchYatheem();
    } catch (error) {
      console.error("Error deleting yatheem:", error);
      setError("Failed to delete yatheem. Please try again.");
    }
  };

  const handleAssignSponsor = async (sponsorId: string) => {
    if (!selectedYatheemId) return;
    try {
      const response = await fetch("/api/yatheem/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify({ yatheemId: selectedYatheemId, sponsorId }),
      });
      if (!response.ok) throw new Error("Failed to assign sponsor");
      await fetchYatheem();
      setShowAssignModal(false);
      setSearchSponsor("");
      setSelectedYatheemId(null);
    } catch (error) {
      console.error("Error assigning sponsor:", error);
      setError("Failed to assign sponsor. Please try again.");
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const filteredSponsors = searchSponsor
    ? sponsors.filter(
      (s) =>
        s.name?.toLowerCase().includes(searchSponsor.toLowerCase()) ||
        s.phone?.includes(searchSponsor)
    )
    : sponsors;

  const handleOpenAssignModal = (yatheemId: string) => {
    setSelectedYatheemId(yatheemId);
    setShowAssignModal(true);
    setSearchSponsor("");
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedYatheemId(null);
    setSearchSponsor("");
  };

  const stats = {
    total: yatheem.length,
    assigned: yatheem.filter((y) => y.sponsorId !== null).length,
    unassigned: yatheem.filter((y) => y.sponsorId === null).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <Link
              href="/admin/sponsorships"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sponsorships
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Yatheem Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and track orphaned students for educational support
            </p>
          </div>
          <motion.button
            onClick={() => setShowAddForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Yatheem
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-indigo-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Yatheem</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-green-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.assigned}</p>
              </div>
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-orange-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats.unassigned}</p>
              </div>
              <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <XCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Add Form Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ name: "", phone: "", place: "", class: "", school: "" });
                setError(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Add New Yatheem</h2>
                      <p className="text-indigo-100 mt-1">Fill in the details below</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData({ name: "", phone: "", place: "", class: "", school: "" });
                        setError(null);
                      }}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
                    >
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleAddYatheem} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => handleFormChange("name", e.target.value)}
                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Enter full name"
                          />
                          <Users className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => handleFormChange("phone", e.target.value)}
                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Enter phone number"
                          />
                          <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Place <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.place}
                            onChange={(e) => handleFormChange("place", e.target.value)}
                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Enter place"
                          />
                          <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Class <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.class}
                            onChange={(e) => handleFormChange("class", e.target.value)}
                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="e.g., 5th Grade"
                          />
                          <GraduationCap className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          School <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.school}
                            onChange={(e) => handleFormChange("school", e.target.value)}
                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Enter school name"
                          />
                          <School className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-5 w-5 mr-2" />
                            Add Yatheem
                          </>
                        )}
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setFormData({ name: "", phone: "", place: "", class: "", school: "" });
                          setError(null);
                        }}
                        className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assign Sponsor Modal */}
        <AnimatePresence>
          {showAssignModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={handleCloseAssignModal}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">Assign Sponsor</h2>
                      <p className="text-indigo-100 mt-1">Select a sponsor to assign to this yatheem</p>
                    </div>
                    <button
                      onClick={handleCloseAssignModal}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search sponsors by name or phone..."
                        value={searchSponsor}
                        onChange={(e) => setSearchSponsor(e.target.value)}
                        className="pl-12 pr-4 py-3 w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                      />
                    </div>
                  </div>

                  {sponsors.length === 0 ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Loading sponsors...</p>
                    </div>
                  ) : filteredSponsors.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No sponsors found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSponsors.map((sponsor, index) => (
                        <motion.div
                          key={sponsor._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                {sponsor.name || "No name"}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {sponsor.phone}
                                </span>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                                  {sponsor.type}
                                </span>
                              </div>
                              <div className="flex gap-4 text-xs">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Paid: ₹{(sponsor.paidAmount || sponsor.amount || 0).toLocaleString()}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                  Selected: ₹{(sponsor.selectedAmount || sponsor.amount || 0).toLocaleString()}
                                </span>
                              </div>
                              {sponsor.yatheemId && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Already has a yatheem assigned
                                </p>
                              )}
                            </div>
                            <motion.button
                              onClick={() => handleAssignSponsor(sponsor._id)}
                              disabled={!!sponsor.yatheemId}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all font-semibold shadow-lg"
                            >
                              <UserPlus className="h-4 w-4" />
                              Assign
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-indigo-100 dark:border-gray-700 overflow-hidden"
        >
          {/* Search and Filter Bar */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${filteredYatheem.length} yatheem by name, phone, place or school...`}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-1">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === "all"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus("assigned")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === "assigned"
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    Assigned
                  </button>
                  <button
                    onClick={() => setFilterStatus("unassigned")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === "unassigned"
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    Pending
                  </button>
                </div>

                <div className="flex bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "grid"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "table"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && !showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Area */}
          <div className="p-6">
            {isLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading yatheem data...</p>
              </div>
            ) : filteredYatheem.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                  <Users className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Yatheem Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchText || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by adding your first yatheem."}
                </p>
                {!searchText && filterStatus === "all" && (
                  <motion.button
                    onClick={() => setShowAddForm(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all"
                  >
                    Add First Yatheem
                  </motion.button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredYatheem.map((y, index) => (
                  <motion.div
                    key={y._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-800 dark:to-indigo-950/20 rounded-2xl shadow-lg hover:shadow-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {y.name}
                          </h3>
                          {y.sponsorId ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              <CheckCircle className="h-3 w-3" />
                              Assigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                              <XCircle className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span>{y.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span>{y.place}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span>{y.class}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <School className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="truncate">{y.school}</span>
                        </div>
                      </div>

                      {/* Sponsor Info */}
                      {y.sponsorId && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                          <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">Sponsored By</p>
                          <p className="text-sm font-bold text-green-900 dark:text-green-200">{y.sponsorId.name}</p>
                          <p className="text-xs text-green-700 dark:text-green-400">{y.sponsorId.phone}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {!y.sponsorId && (
                          <motion.button
                            onClick={() => handleOpenAssignModal(y._id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
                          >
                            <UserPlus className="h-4 w-4" />
                            Assign
                          </motion.button>
                        )}
                        <Link
                          href={`/admin/sponsorships/yatheem/${y._id}`}
                          className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(y._id)}
                          className="p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-x-auto rounded-xl border-2 border-gray-200 dark:border-gray-700"
              >
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Education
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Sponsor Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredYatheem.map((y, index) => (
                      <motion.tr
                        key={y._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {y.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{y.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {y.place}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900 dark:text-gray-300 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {y.phone}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              {y.class}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">{y.school}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {y.sponsorId ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                <CheckCircle className="h-3 w-3" />
                                Assigned
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                              <XCircle className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {!y.sponsorId && (
                              <motion.button
                                onClick={() => handleOpenAssignModal(y._id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all"
                                title="Assign Sponsor"
                              >
                                <UserPlus className="h-4 w-4" />
                              </motion.button>
                            )}
                            <Link
                              href={`/admin/sponsorships/yatheem/${y._id}`}
                              className="p-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(y._id)}
                              className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>

          {/* Footer with result count */}
          {!isLoading && filteredYatheem.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  Showing <span className="font-bold text-gray-900 dark:text-white">{filteredYatheem.length}</span> of{" "}
                  <span className="font-bold text-gray-900 dark:text-white">{yatheem.length}</span> yatheem
                </p>
                {(searchText || filterStatus !== "all") && (
                  <button
                    onClick={() => {
                      setSearchText("");
                      setFilterStatus("all");
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}