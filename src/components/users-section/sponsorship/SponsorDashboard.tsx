"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Phone, Mail, Heart, AlertCircle, CheckCircle, LogOut, 
  CreditCard, History, MapPin, TrendingUp, Calendar, DollarSign,
  ChevronDown, ChevronUp, Eye, EyeOff, Receipt, Clock, Info
} from "lucide-react";

interface SponsorDashboardProps {
  phoneNumber: string;
  selectedAmount: number;
  refreshKey?: number;
  onPayNow: (type: "complete" | "split", customAmount?: number, isExtraExpense?: boolean) => void;
  onLogout?: () => void;
}

interface PaymentRecord {
  _id: string;
  amount: number;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  paymentDate: string;
  status: string;
  type: "main" | "extra";
}

interface SponsorData {
  _id: string;
  name: string | null;
  phone: string;
  email: string | null;
  district: string | null;
  panchayat: string | null;
  selectedAmount: number;
  paidAmount: number;
  type: string;
  method: string;
  period: string;
  status: string;
  createdAt: string;
  paymentHistory?: PaymentRecord[];
  yatheem?: {
    _id: string;
    name: string;
    phone: string;
    place: string;
    class: string;
    school: string;
    totalExpenses: number;
    expenses: Array<{
      _id: string;
      need: string;
      amount: number;
      customFields: Array<{ label: string; value: string }>;
      createdAt: string;
    }>;
  };
}

export default function ProfessionalSponsorDashboard({ 
  phoneNumber, 
  selectedAmount, 
  refreshKey = 0, 
  onPayNow, 
  onLogout 
}: SponsorDashboardProps) {
  const [sponsorData, setSponsorData] = useState<SponsorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showExtraExpensePayment, setShowExtraExpensePayment] = useState(false);
  const [splitAmount, setSplitAmount] = useState("");
  const [extraExpenseAmount, setExtraExpenseAmount] = useState("");
  const [error, setError] = useState("");
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);

  useEffect(() => {
    fetchSponsorData();
  }, [phoneNumber, refreshKey]);

  const fetchSponsorData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sponsorships/dashboard?phone=${encodeURIComponent(phoneNumber)}`, {
        headers: {
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch sponsor data");
      const data = await response.json();
      setSponsorData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDirectPayment = async (amount: number, isExtraExpense = false) => {
    if (!sponsorData) {
      setError("Sponsor data not loaded");
      return;
    }

    const hasCompleteData = sponsorData.name && sponsorData.email && sponsorData.district && sponsorData.panchayat;
    const remainingAmount = sponsorData.selectedAmount - sponsorData.paidAmount;

    if (!hasCompleteData) {
      if (amount === remainingAmount) {
        onPayNow("complete", undefined, isExtraExpense);
      } else {
        onPayNow("split", amount, isExtraExpense);
      }
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Failed to load Razorpay SDK");

      const orderResponse = await fetch("/api/donations/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify({
          amount: amount * 100,
          type: sponsorData.type,
          name: sponsorData.name,
          phone: sponsorData.phone,
          email: sponsorData.email,
          district: sponsorData.district,
          panchayat: sponsorData.panchayat,
          period: sponsorData.period,
        }),
      });

      const orderData: { orderId: string; error?: string } = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error || "Order creation failed");

      return new Promise((resolve, reject) => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: amount * 100,
          currency: "INR",
          name: "AIC Amal App",
          description: `Sponsorship Payment - ${sponsorData.type === "Sponsor-Yatheem" ? "Yatheem" : "Hafiz"}`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              const paymentData = {
                amount: amount,
                name: sponsorData.name,
                phone: sponsorData.phone,
                type: sponsorData.type,
                email: sponsorData.email,
                district: sponsorData.district,
                panchayat: sponsorData.panchayat,
                period: sponsorData.period,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                selectedAmount: sponsorData.selectedAmount,
                paymentType: isExtraExpense ? "extra" : "main",
              };

              const saveResponse = await fetch("/api/sponsorships/create", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
                },
                body: JSON.stringify(paymentData),
              });

              const saveData = await saveResponse.json();
              if (!saveResponse.ok) throw new Error(saveData.error || "Failed to save payment");

              await fetchSponsorData();
              setShowPaymentOptions(false);
              setShowExtraExpensePayment(false);
              setSplitAmount("");
              setExtraExpenseAmount("");

              resolve({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
            } catch (error: any) {
              reject(error);
            } finally {
              setIsLoading(false);
            }
          },
          prefill: {
            name: sponsorData.name || "",
            contact: sponsorData.phone,
            email: sponsorData.email || "",
          },
          theme: { color: "#4F46E5" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          setError(`Payment failed: ${response.error?.description || "Unknown error"}`);
          setIsLoading(false);
          reject(new Error("Payment failed"));
        });
        rzp.open();
      });
    } catch (error: any) {
      setError(error.message || "Payment initiation failed");
      setIsLoading(false);
    }
  };

  const handleCompletePayment = () => {
    if (sponsorData) {
      handleDirectPayment(remainingAmount, false);
    }
  };

  const handleSplitPayment = () => {
    const amount = parseFloat(splitAmount);
    if (!splitAmount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    const remaining = (sponsorData?.selectedAmount || selectedAmount) - (sponsorData?.paidAmount || 0);
    if (amount > remaining) {
      setError(`Amount cannot exceed remaining balance of ₹${remaining.toLocaleString()}`);
      return;
    }
    setError("");
    handleDirectPayment(amount, false);
  };

  const handleExtraExpensePayment = () => {
    const amount = parseFloat(extraExpenseAmount);
    if (!extraExpenseAmount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    const extraNeeded = (sponsorData?.yatheem?.totalExpenses || 0) - (sponsorData?.paidAmount || 0);
    if (amount > extraNeeded) {
      setError(`Amount cannot exceed extra expense of ₹${extraNeeded.toLocaleString()}`);
      return;
    }
    setError("");
    handleDirectPayment(amount, true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-indigo-100 dark:border-gray-700"
          >
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-indigo-600 dark:border-indigo-400 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
              </div>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">Loading your dashboard...</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && !sponsorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-red-200 dark:border-red-900"
          >
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!sponsorData) return null;

  const progressPercentage = sponsorData.selectedAmount > 0
    ? Math.min((sponsorData.paidAmount / sponsorData.selectedAmount) * 100, 100)
    : 0;

  const remainingAmount = sponsorData.selectedAmount - sponsorData.paidAmount;
  const isCompleted = sponsorData.paidAmount >= sponsorData.selectedAmount;
  const hasYatheem = sponsorData.yatheem !== null && sponsorData.yatheem !== undefined;
  const yatheemTotalExpenses = sponsorData.yatheem?.totalExpenses || 0;
  const balanceAfterExpenses = sponsorData.paidAmount - yatheemTotalExpenses;
  const hasNullDetails = !sponsorData.name || !sponsorData.email || !sponsorData.district || !sponsorData.panchayat;
  const hasExtraExpenses = isCompleted && yatheemTotalExpenses > sponsorData.paidAmount;
  const extraExpenseAmountNeeded = hasExtraExpenses ? yatheemTotalExpenses - sponsorData.paidAmount : 0;

  const formatAmount = (amount: number) => hideAmounts ? "••••" : `₹${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome Back!</h1>
              <p className="text-indigo-100 text-lg">{sponsorData.name || "Valued Sponsor"}</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setHideAmounts(!hideAmounts)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-colors"
              >
                {hideAmounts ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </motion.button>
              {onLogout && (
                <motion.button
                  onClick={onLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-colors flex items-center gap-2 font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </motion.button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/30 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-indigo-100">Total Paid</p>
                  <p className="text-2xl font-bold">{formatAmount(sponsorData.paidAmount)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/30 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-indigo-100">Progress</p>
                  <p className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/30 rounded-lg">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-indigo-100">Member Since</p>
                  <p className="text-lg font-bold">
                    {new Date(sponsorData.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Progress Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-indigo-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Heart className="h-7 w-7 text-red-500" />
                  Payment Progress
                </h2>
                {hasNullDetails && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium rounded-full flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Action Required
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completion Status
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden shadow-inner">
                  <motion.div
                    className={`h-full ${isCompleted
                      ? "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600"
                      : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
                    } relative`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </motion.div>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{formatAmount(sponsorData.paidAmount)}</span>
                  <span className="font-medium">{formatAmount(sponsorData.selectedAmount)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Selected Amount</p>
                  <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-300">{formatAmount(sponsorData.selectedAmount)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-2xl p-5 border border-purple-100 dark:border-purple-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">{formatAmount(remainingAmount)}</p>
                </div>
              </div>

              {/* Payment Actions */}
              {!isCompleted && (
                <AnimatePresence mode="wait">
                  {!showPaymentOptions ? (
                    <motion.button
                      key="pay-now"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => setShowPaymentOptions(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                        hasNullDetails
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white animate-pulse"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <CreditCard className="h-6 w-6" />
                        Pay Now - {formatAmount(remainingAmount)} Remaining
                      </span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="payment-options"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                          onClick={handleCompletePayment}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Pay Full Amount
                        </motion.button>
                        <motion.button
                          onClick={() => setShowPaymentOptions(false)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </motion.button>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                            Or split your payment
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Enter Custom Amount
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="number"
                            placeholder="Enter amount"
                            value={splitAmount}
                            onChange={(e) => {
                              setSplitAmount(e.target.value);
                              setError("");
                            }}
                            className="flex-1 px-4 py-3 border-2 border-indigo-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg font-medium"
                            min="1"
                            max={remainingAmount}
                          />
                          <motion.button
                            onClick={handleSplitPayment}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all duration-300"
                          >
                            Pay
                          </motion.button>
                        </div>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                          >
                            <AlertCircle className="h-4 w-4" />
                            {error}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-full">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900 dark:text-green-300">
                        Payment Completed!
                      </h3>
                      <p className="text-green-700 dark:text-green-400">
                        Thank you for your generous contribution
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Yatheem Section */}
            {hasYatheem && sponsorData.yatheem && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-purple-100 dark:border-gray-700"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <Heart className="h-7 w-7 text-pink-500" />
                  Your Sponsored Yatheem
                </h2>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-900 mb-6">
                  <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-300 mb-4">
                    {sponsorData.yatheem.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Class</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sponsorData.yatheem.class}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">School</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sponsorData.yatheem.school}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Place</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sponsorData.yatheem.place}</p>
                    </div>
                  </div>
                </div>

                {/* Expenses Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-900">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Total Expenses</h3>
                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {formatAmount(yatheemTotalExpenses)}
                    </span>
                  </div>

                  {/* Balance Status */}
                  {balanceAfterExpenses < 0 && !isCompleted && (
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-900 dark:text-yellow-300">Balance Due</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          {formatAmount(Math.abs(balanceAfterExpenses))} ready to pay
                        </p>
                      </div>
                    </div>
                  )}

                  {balanceAfterExpenses >= 0 && !isCompleted && (
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Balance Remaining: {formatAmount(balanceAfterExpenses)}
                      </p>
                    </div>
                  )}

                  {/* Extra Expenses */}
                  {hasExtraExpenses && (
                    <div className="mt-4 p-4 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-bold text-orange-900 dark:text-orange-300">Extra Expenses Available</p>
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {formatAmount(extraExpenseAmountNeeded)}
                          </p>
                        </div>
                        {!showExtraExpensePayment ? (
                          <motion.button
                            onClick={() => setShowExtraExpensePayment(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Pay Extra
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => {
                              setShowExtraExpensePayment(false);
                              setExtraExpenseAmount("");
                              setError("");
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
                          >
                            Cancel
                          </motion.button>
                        )}
                      </div>
                      {showExtraExpensePayment && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex gap-2"
                        >
                          <input
                            type="number"
                            placeholder={`Max ${hideAmounts ? "••••" : `₹${extraExpenseAmountNeeded.toLocaleString()}`}`}
                            value={extraExpenseAmount}
                            onChange={(e) => {
                              setExtraExpenseAmount(e.target.value);
                              setError("");
                            }}
                            className="flex-1 px-4 py-2 border-2 border-orange-200 dark:border-orange-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            min="1"
                            max={extraExpenseAmountNeeded}
                          />
                          <motion.button
                            onClick={handleExtraExpensePayment}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors"
                          >
                            Pay
                          </motion.button>
                        </motion.div>
                      )}
                      {error && showExtraExpensePayment && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                      )}
                    </div>
                  )}

                  {/* Expenses List */}
                  {sponsorData.yatheem.expenses && sponsorData.yatheem.expenses.length > 0 && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowExpenseDetails(!showExpenseDetails)}
                        className="w-full flex items-center justify-between text-left p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          View Expense Details ({sponsorData.yatheem.expenses.length})
                        </span>
                        {showExpenseDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                      
                      <AnimatePresence>
                        {showExpenseDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-3"
                          >
                            {sponsorData.yatheem.expenses.map((expense) => (
                              <motion.div
                                key={expense._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                      {expense.need}
                                    </h4>
                                    {expense.customFields && expense.customFields.length > 0 && (
                                      <div className="space-y-1">
                                        {expense.customFields.map((field, idx) => (
                                          <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">{field.label}:</span> {field.value}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                      {formatAmount(expense.amount)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(expense.createdAt).toLocaleDateString("en-IN", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Personal Details Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-indigo-100 dark:border-gray-700"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                Personal Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {sponsorData.name || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Phone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {sponsorData.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">
                      {sponsorData.email || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {sponsorData.district || "Not provided"}
                      {sponsorData.panchayat && `, ${sponsorData.panchayat}`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sponsorship Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-purple-100 dark:border-gray-700"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                Sponsorship Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                  <span className="font-semibold text-purple-900 dark:text-purple-300">
                    {sponsorData.type === "Sponsor-Yatheem" ? "Yatheem" : "Hafiz"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Period</span>
                  <span className="font-semibold text-purple-900 dark:text-purple-300">
                    {sponsorData.period}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isCompleted 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                  }`}>
                    {isCompleted ? "Completed" : "In Progress"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Payment History Card */}
            {sponsorData.paymentHistory && sponsorData.paymentHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-green-100 dark:border-gray-700"
              >
                <button
                  onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <History className="h-6 w-6 text-green-600 dark:text-green-400" />
                    Payment History
                  </h3>
                  {showPaymentHistory ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                <AnimatePresence>
                  {showPaymentHistory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      {sponsorData.paymentHistory.map((payment, index) => (
                        <motion.div
                          key={payment._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-900"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {formatAmount(payment.amount)}
                              </p>
                              {payment.type === "extra" && (
                                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                  Extra Expense
                                </span>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              payment.status === "success"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {new Date(payment.paymentDate).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            ID: {payment.razorpayPaymentId}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}