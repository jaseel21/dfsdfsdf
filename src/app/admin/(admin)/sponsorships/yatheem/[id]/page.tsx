"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X, UserPlus, Search, Phone, MapPin, GraduationCap, School, TrendingUp, DollarSign, Receipt, Check, AlertCircle, FileText, Clock } from "lucide-react";
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

interface Expense {
  _id: string;
  need: string;
  amount: number;
  customFields: Array<{ label: string; value: string }>;
  createdAt: string;
}

interface CustomField {
  label: string;
  value: string;
}

export default function YatheemDetailPage() {
  const params = useParams();

  const id = params.id as string;

  const [yatheem, setYatheem] = useState<Yatheem | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    need: "",
    amount: "",
    customFields: [] as CustomField[],
  });
  const [newCustomField, setNewCustomField] = useState({ label: "", value: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [searchSponsor, setSearchSponsor] = useState("");

  useEffect(() => {
    fetchYatheem();
    fetchExpenses();
    if (showAssignModal) {
      fetchSponsors();
    }
  }, [id, showAssignModal]);

  const fetchYatheem = async () => {
    try {
      const response = await fetch(`/api/yatheem/${id}`, {
        headers: {
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch yatheem");
      const data = await response.json();
      setYatheem(data);
    } catch (error) {
      console.error("Error fetching yatheem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`/api/yatheem/expenses?yatheemId=${id}`, {
        headers: {
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/yatheem/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify({
          yatheemId: id,
          need: expenseForm.need,
          amount: parseFloat(expenseForm.amount),
          customFields: expenseForm.customFields,
        }),
      });
      if (!response.ok) throw new Error("Failed to add expense");
      await fetchExpenses();
      setShowExpenseForm(false);
      setExpenseForm({ need: "", amount: "", customFields: [] });
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const response = await fetch(`/api/yatheem/expenses/${expenseId}`, {
        method: "DELETE",
        headers: {
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });
      if (!response.ok) throw new Error("Failed to delete expense");
      await fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense");
    }
  };

  const addCustomField = () => {
    if (newCustomField.label && newCustomField.value) {
      setExpenseForm({
        ...expenseForm,
        customFields: [...expenseForm.customFields, newCustomField],
      });
      setNewCustomField({ label: "", value: "" });
    }
  };

  const removeCustomField = (index: number) => {
    setExpenseForm({
      ...expenseForm,
      customFields: expenseForm.customFields.filter((_, i) => i !== index),
    });
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
    }
  };

  const handleAssignSponsor = async (sponsorId: string) => {
    try {
      const response = await fetch("/api/yatheem/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify({ yatheemId: id, sponsorId }),
      });
      if (!response.ok) throw new Error("Failed to assign sponsor");
      await fetchYatheem();
      setShowAssignModal(false);
    } catch (error) {
      console.error("Error assigning sponsor:", error);
      alert("Failed to assign sponsor");
    }
  };

  const handleUnassignSponsor = async () => {
    if (!confirm("Are you sure you want to unassign this sponsor?")) return;
    try {
      if (yatheem?.sponsorId?._id) {
        const sponsorResponse = await fetch(`/api/admin/sponsorships/${yatheem.sponsorId._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
          },
          body: JSON.stringify({ yatheemId: null }),
        });
        if (!sponsorResponse.ok) throw new Error("Failed to update sponsor");
      }

      const response = await fetch(`/api/yatheem/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify({ sponsorId: null }),
      });
      if (!response.ok) throw new Error("Failed to unassign sponsor");

      await fetchYatheem();
    } catch (error) {
      console.error("Error unassigning sponsor:", error);
      alert("Failed to unassign sponsor");
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const filteredSponsors = searchSponsor
    ? sponsors.filter(
      (s) =>
        s.name?.toLowerCase().includes(searchSponsor.toLowerCase()) ||
        s.phone?.includes(searchSponsor)
    )
    : sponsors;

  const sponsorCoverage = yatheem?.sponsorId
    ? Math.min(100, (yatheem.sponsorId.paidAmount / totalExpenses) * 100)
    : 0;

  const remainingBalance = Math.max(0, totalExpenses - (yatheem?.sponsorId?.paidAmount || 0));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!yatheem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Yatheem Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The requested yatheem profile could not be found.</p>
          <Link
            href="/admin/sponsorships/yatheem-list"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Sticky Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <Link
            href="/admin/sponsorships/yatheem-list"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-all group font-medium"
          >
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            </div>
            <span>Back to Yatheem List</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Header Card */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-xl rounded-2xl border-4 border-white/30 flex items-center justify-center shadow-xl">
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    {yatheem.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {yatheem.name}
                  </h1>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm font-semibold shadow-lg">
                    {yatheem.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium mb-1">Phone</p>
                        <p className="text-white font-semibold">{yatheem.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium mb-1">Location</p>
                        <p className="text-white font-semibold">{yatheem.place}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium mb-1">Class</p>
                        <p className="text-white font-semibold">{yatheem.class}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <School className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium mb-1">School</p>
                        <p className="text-white font-semibold text-sm">{yatheem.school}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Expenses</p>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sponsor Paid</p>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                ₹{(yatheem.sponsorId?.paidAmount || 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sponsorCoverage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {sponsorCoverage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Balance Due</p>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                ₹{remainingBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {remainingBalance === 0 ? 'Fully covered' : 'Amount needed'}
              </p>
            </div>
          </div>
        </div>

        {/* Sponsor Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sponsor Information</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage sponsor assignment</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {yatheem.sponsorId ? (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                        {yatheem.sponsorId.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sponsor Name</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {yatheem.sponsorId.name}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {yatheem.sponsorId.phone}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pledged</p>
                        </div>
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                          ₹{yatheem.sponsorId.selectedAmount?.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paid</p>
                        </div>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          ₹{yatheem.sponsorId.paidAmount?.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Progress</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {((yatheem.sponsorId.paidAmount / yatheem.sponsorId.selectedAmount) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-white dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-lg"
                          style={{ width: `${Math.min(100, (yatheem.sponsorId.paidAmount / yatheem.sponsorId.selectedAmount) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>₹{yatheem.sponsorId.paidAmount?.toLocaleString('en-IN')}</span>
                        <span>₹{yatheem.sponsorId.selectedAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUnassignSponsor}
                    className="lg:self-start px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all font-medium border border-red-200 dark:border-red-800 shadow-sm hover:shadow flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Unassign Sponsor
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Sponsor Assigned</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Assign a sponsor to help support this yatheem's educational and living expenses.
                </p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  <UserPlus className="h-5 w-5" />
                  Assign a Sponsor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Life Expenses</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Track and manage all expenses</p>
                </div>
              </div>
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {showExpenseForm && (
              <form onSubmit={handleAddExpense} className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/30 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add New Expense</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Need/Description *
                    </label>
                    <input
                      type="text"
                      required
                      value={expenseForm.need}
                      onChange={(e) => setExpenseForm({ ...expenseForm, need: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all shadow-sm"
                      placeholder="e.g., School fees, Books, Uniform"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Amount (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all shadow-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Additional Information (Optional)
                  </label>

                  {expenseForm.customFields.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {expenseForm.customFields.map((field, index) => (
                        <div key={index} className="flex gap-2 items-center p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            <strong className="text-indigo-600 dark:text-indigo-400">{field.label}:</strong> {field.value}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCustomField(index)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomField.label}
                      onChange={(e) => setNewCustomField({ ...newCustomField, label: e.target.value })}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      placeholder="Label (e.g., Receipt No)"
                    />
                    <input
                      type="text"
                      value={newCustomField.value}
                      onChange={(e) => setNewCustomField({ ...newCustomField, value: e.target.value })}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors shadow-sm"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        <span>Add Expense</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseForm(false);
                      setExpenseForm({ need: "", amount: "", customFields: [] });
                    }}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {expenses.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Expenses Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Start tracking expenses by clicking the "Add Expense" button above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="group p-5 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all bg-white dark:bg-gray-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <Receipt className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                            {expense.need}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(expense.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                          {expense.customFields && expense.customFields.length > 0 && (
                            <div className="space-y-1.5">
                              {expense.customFields.map((field, idx) => (
                                <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm mr-2">
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">{field.label}:</span>
                                  <span className="text-gray-600 dark:text-gray-400">{field.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            ₹{expense.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shadow-sm hover:shadow"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Sponsor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 border-b border-indigo-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Assign Sponsor</h2>
                  <p className="text-indigo-100 mt-1">
                    Select a sponsor for {yatheem?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSearchSponsor("");
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sponsors by name or phone..."
                    value={searchSponsor}
                    onChange={(e) => setSearchSponsor(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all shadow-sm"
                  />
                </div>
              </div>

              {filteredSponsors.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No sponsors found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try adjusting your search</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSponsors.map((sponsor) => {
                    const isAssigned = !!(sponsor as any).yatheemId;
                    return (
                      <div
                        key={sponsor._id}
                        className={`p-5 border-2 rounded-xl transition-all ${isAssigned
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg bg-white dark:bg-gray-800'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                              {(sponsor.name || 'N').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                {sponsor.name || "No name"}
                              </h4>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" />
                                  {sponsor.phone}
                                </span>
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                                  {sponsor.type}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Paid:</span>
                                  <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
                                    ₹{(sponsor.paidAmount || sponsor.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Selected:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                    ₹{(sponsor.selectedAmount || sponsor.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                              {isAssigned && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium flex items-center gap-1">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Already has a yatheem assigned
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAssignSponsor(sponsor._id)}
                            disabled={isAssigned}
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>Assign</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}