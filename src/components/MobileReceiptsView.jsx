'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { auth, sendOTP, isTestMode } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { generatePDF } from '@/lib/receipt-pdf';

const MobileReceiptsView = () => {
  const router = useRouter();
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState(null);
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [showReceiptsList, setShowReceiptsList] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptDetail, setShowReceiptDetail] = useState(false);

  // Initialize client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Restore session from sessionStorage and Firebase auth state
  useEffect(() => {
    if (!isClient) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated, check sessionStorage
        const storedPhone = sessionStorage.getItem("receipts_phone");
        if (storedPhone) {
          setPhoneNumber(storedPhone);
          setStep("verified");
          fetchReceipts(storedPhone);
        }
      } else {
        // No user, clear sessionStorage and reset to phone step
        sessionStorage.removeItem("receipts_phone");
        setStep("phone");
        setPhoneNumber("");
      }
    });

    return () => unsubscribe();
  }, [isClient]);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!isClient || isTestMode) {
      return;
    }

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            console.log("Recaptcha verified");
          },
          "expired-callback": () => {
            console.log("Recaptcha expired. Please refresh.");
            setError("Recaptcha expired. Please try again.");
          },
        });
      }
      window.recaptchaVerifier.render();
    } catch (err) {
      console.error("Error initializing reCAPTCHA:", err);
      setError("Failed to initialize reCAPTCHA. Please refresh and try again.");
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, [isClient]);

  // Fetch real receipts data
  const fetchReceipts = async (phone) => {
    try {
      const response = await fetch(
        `/api/receipts?phone=${encodeURIComponent(phone)}&page=1&limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch receipts: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.receipts) && data.receipts.length > 0) {
        setReceipts(data.receipts);
        setTotalAmount(data.totals.totalAmount || 0);
        setTotalDonations(data.totals.totalDonations || 0);
      } else {
        setReceipts([]);
        setTotalAmount(0);
        setTotalDonations(0);
        toast.warn("No donations found for this number");
      }
    } catch (err) {
      console.error("Error fetching receipts:", err);
      toast.error("Failed to load receipts. Please try again.");
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sendOTP(phoneNumber);
      if (!result) {
        throw new Error("Failed to send OTP. Please try again.");
      }
      setConfirmationResult(result);
      setStep("otp");
      toast.success("OTP sent successfully!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otpInput.join("");
    if (otpCode.length !== 6) {
      setError("Please enter complete 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!confirmationResult) {
        throw new Error("Verification session expired. Please try again.");
      }
      await confirmationResult.confirm(otpCode);
      // Store phone number in sessionStorage after successful verification
      sessionStorage.setItem("receipts_phone", phoneNumber);
      setStep("verified");
      await fetchReceipts(phoneNumber);
      toast.success("Phone verified successfully!");
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError(error instanceof Error ? error.message : "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch individual receipt details
  const fetchReceiptDetail = async (receiptId) => {
    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        headers: {
          'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch receipt details');
      }

      const data = await response.json();
      console.log('Receipt detail API response:', data); // Debug log
      setSelectedReceipt(data.receipt);
      setShowReceiptDetail(true);
    } catch (err) {
      console.error('Error fetching receipt details:', err);
      toast.error('Failed to load receipt details. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format amount with ₹ symbol
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate receipt number
  const generateReceiptNumber = (receipt) => {
    if (receipt.receiptNumber) return receipt.receiptNumber;
    if (receipt.razorpayOrderId) {
      return `RCP-${receipt.razorpayOrderId.slice(-8).toUpperCase()}`;
    }
    return `RCP-${receipt._id.toString().slice(-8).toUpperCase()}`;
  };

  // Handle PDF download
  const handleDownloadPDF = async (receipt) => {
    try {
      await generatePDF(receipt);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      // Clear sessionStorage
      sessionStorage.removeItem("receipts_phone");
      // Reset state
      setStep("phone");
      setPhoneNumber("");
      setConfirmationResult(null);
      setError(null);
      setReceipts([]);
      setTotalAmount(0);
      setTotalDonations(0);
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to log out. Please try again.");
      toast.error("Failed to log out.");
    }
  };

  const handleOtpInputChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otpInput];
    newOtp[index] = value;
    setOtpInput(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <>
      <div id="recaptcha-container" className="hidden"></div>
      <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 min-h-screen flex flex-col">
        <div className="px-4 pt-12 pb-6">
          {/* Header - Navigation Menu */}
          <div className="flex items-center justify-end mb-8 relative">
            <button 
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Navigation Dropdown */}
            {showNavMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNavMenu(false)}
                ></div>
                
                {/* Dropdown Menu */}
                <div className="absolute top-12 right-0 bg-white rounded-xl shadow-lg z-50 min-w-[200px] border border-gray-100">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        router.push('/mobile-donation');
                        setShowNavMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="font-medium">Donation</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/mobile-subscription');
                        setShowNavMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="font-medium">Subscription</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Central content area */}
          <div className="flex flex-col items-center text-center text-white mb-8">
            <div className="bg-white/10 p-4 rounded-full mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Your Receipts</h2>
            <p className="text-white/80 text-sm mb-6">
              {step === "phone" && "Enter your phone number to get started"}
              {step === "otp" && "Verify your identity with OTP"}
              {step === "verified" && "View and download your donation receipts"}
            </p>

            {/* Summary for verified users */}
            {step === "verified" && (
              <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <h3 className="text-sm text-white/70 mb-1">Total Donations</h3>
                  <p className="text-xl font-bold text-white">{totalDonations}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <h3 className="text-sm text-white/70 mb-1">Total Amount</h3>
                  <p className="text-xl font-bold text-white">₹{totalAmount.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Phone input step */}
          {step === "phone" && (
            <div className="space-y-4 mb-6">
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent"
              />
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                  <p className="text-red-100 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* OTP input step */}
          {step === "otp" && (
            <div className="space-y-4 mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                {otpInput.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInputChange(index, e.target.value)}
                    className="w-12 h-12 text-center border border-white/20 rounded-xl text-white bg-white/10 text-lg font-semibold focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                ))}
              </div>
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                  <p className="text-red-100 text-sm">{error}</p>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <button className="text-white/80 hover:text-white">Resend OTP</button>
                <button 
                  onClick={() => setStep("phone")}
                  className="text-white/80 hover:text-white"
                >
                  Change Number
                </button>
              </div>
            </div>
          )}

          {/* Verified step */}
          {step === "verified" && (
            <div className="space-y-4 mb-6">
              <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-white/70">Logged in as</p>
                  <p className="font-semibold text-white">{phoneNumber}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/20 text-red-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center mt-2">
            <div>
              <style>
                {`
                  @keyframes shine {
                      0% {
                          background-position: 200% 0;
                      }
                      100% {
                          background-position: -100% 0;
                      }
                  }
                  .shine-effect::before {
                      content: '';
                      position: absolute;
                      inset: 0;
                      border-radius: inherit;
                      background: linear-gradient(
                          45deg,
                          transparent 25%,
                          rgba(255, 255, 255, 0.3) 50%,
                          transparent 75%,
                          transparent 100%
                      );
                      background-size: 250% 250%;
                      background-repeat: no-repeat;
                      animation: shine 3s ease infinite;
                  }
                  .enhanced-button {
                      background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B35 100%);
                      box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4), 
                                  0 4px 15px rgba(255, 165, 0, 0.3),
                                  inset 0 1px 0 rgba(255, 255, 255, 0.2);
                      border: 2px solid rgba(255, 255, 255, 0.2);
                      transform: translateY(0);
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                  .enhanced-button:hover {
                      background: linear-gradient(135deg, #FFE55C 0%, #FFB84D 50%, #FF8C42 100%);
                      box-shadow: 0 12px 35px rgba(255, 215, 0, 0.6), 
                                  0 6px 20px rgba(255, 165, 0, 0.4),
                                  inset 0 1px 0 rgba(255, 255, 255, 0.3);
                      transform: translateY(-2px);
                  }
                  .enhanced-button:active {
                      transform: translateY(0);
                      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
                  }
                `}
              </style>
              <button
                className="relative rounded-full py-3 px-6 overflow-hidden flex items-center justify-center min-w-[180px] shine-effect enhanced-button"
                onClick={
                  step === "phone" ? handlePhoneSubmit :
                  step === "otp" ? handleVerifyOTP :
                  () => setShowReceiptsList(!showReceiptsList)
                }
              >
                <span className="relative z-10 text-white font-bold text-lg text-center drop-shadow-lg">
                  {isLoading ? "Loading..." : (
                    step === "phone" ? "Send OTP" :
                    step === "otp" ? "Verify" :
                    (showReceiptsList ? "Hide Receipts" : "View Receipts")
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* App Download Section */}
          <div className="mt-4 flex flex-col items-center">
            <div className="mb-4 text-center">
              <p className="text-white font-semibold text-base md:text-lg">Download Our App</p>
              <p className="text-yellow-200 text-xs md:text-sm">Available on iOS and Android</p>
            </div>

            <div className="flex flex-row space-x-4 w-full justify-center px-4 sm:px-0">
              <a
                href="https://play.google.com/store/apps/details?id=com.aic.amal"
                className="flex w-36 sm:w-40 h-12 bg-black text-white rounded-xl items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <div className="mr-2 sm:mr-3">
                  <svg viewBox="30 336.7 120.9 129.2" width="18" className="sm:w-5">
                    <path
                      fill="#FFD400"
                      d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7 c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z"
                    />
                    <path
                      fill="#FF3333"
                      d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3 c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1L99.1,401.1z"
                    />
                    <path
                      fill="#48FF48"
                      d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1 c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z"
                    />
                    <path
                      fill="#3BCCFF"
                      d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6 c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs sm:text-xs">GET IT ON</div>
                  <div className="text-sm sm:text-sm font-semibold font-sans -mt-1">Google Play</div>
                </div>
              </a>

              <a
                href="https://apps.apple.com/us/app/aic-amal/id6743961924"
                className="flex w-36 sm:w-40 h-12 bg-black text-white rounded-xl items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <div className="mr-2 sm:mr-3">
                  <svg viewBox="0 0 384 512" width="18" className="sm:w-5">
                    <path
                      fill="currentColor"
                      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs sm:text-xs">Download on the</div>
                  <div className="text-sm sm:text-sm font-semibold font-sans -mt-1">App Store</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Receipts List */}
      {step === "verified" && showReceiptsList && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowReceiptsList(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 bg-gray-50 rounded-t-3xl shadow-lg z-50 h-[80%] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-4 pb-20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Receipts</h2>
                <p className="text-gray-600">Download your donation receipts</p>
              </div>

              {/* Dynamic receipt cards */}
              <div className="space-y-4">
                {receipts.length > 0 ? (
                  receipts.map((receipt, index) => (
                    <div key={receipt._id || index} className="bg-white rounded-xl shadow-sm p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{receipt.donationType || 'General Donation'}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(receipt.createdAt || receipt.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₹{receipt.amount?.toLocaleString()}</p>
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {receipt.status || 'Completed'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Receipt No:</span>
                          <span className="font-medium">{receipt.receiptNumber || receipt._id?.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Donor:</span>
                          <span className="font-medium">
                            {receipt.donorName || 
                             receipt.name || 
                             receipt.donor?.name || 
                             receipt.customerName ||
                             receipt.user?.name ||
                             'Anonymous'}
                          </span>
                        </div>
                        {receipt.transactionId && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Transaction ID:</span>
                            <span className="font-medium text-xs">{receipt.transactionId}</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => fetchReceiptDetail(receipt._id)}
                        className="w-full mt-4 bg-indigo-50 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View Details</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No receipts found</p>
                    <p className="text-sm text-gray-400">Your donation receipts will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Receipt Detail Modal */}
      {showReceiptDetail && selectedReceipt && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[70]"
            onClick={() => setShowReceiptDetail(false)}
          ></div>
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Receipt Details</h2>
                  <button
                    onClick={() => setShowReceiptDetail(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                {/* Receipt Header */}
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold">{selectedReceipt.donationType || 'General Donation'}</h3>
                    <p className="text-2xl font-bold mt-2">{formatAmount(selectedReceipt.amount)}</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedReceipt.status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedReceipt.status === 'Completed' && (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {selectedReceipt.status || 'Completed'}
                    </span>
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Transaction Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Receipt Number:</span>
                        <span className="font-medium">{generateReceiptNumber(selectedReceipt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date & Time:</span>
                        <span className="font-medium">{formatDate(selectedReceipt.createdAt || selectedReceipt.date)}</span>
                      </div>
                      {selectedReceipt.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction ID:</span>
                          <span className="font-medium text-xs">{selectedReceipt.transactionId}</span>
                        </div>
                      )}
                      {selectedReceipt.razorpayOrderId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order ID:</span>
                          <span className="font-medium text-xs">{selectedReceipt.razorpayOrderId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Donor Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {selectedReceipt.donorName || 
                           selectedReceipt.name || 
                           selectedReceipt.donor?.name || 
                           selectedReceipt.customerName ||
                           selectedReceipt.user?.name ||
                           'Anonymous'}
                        </span>
                      </div>
                      {(selectedReceipt.donorEmail || selectedReceipt.email || selectedReceipt.donor?.email || selectedReceipt.user?.email) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">
                            {selectedReceipt.donorEmail || selectedReceipt.email || selectedReceipt.donor?.email || selectedReceipt.user?.email}
                          </span>
                        </div>
                      )}
                      {(selectedReceipt.donorPhone || selectedReceipt.phone || selectedReceipt.donor?.phone || selectedReceipt.user?.phone) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">
                            {selectedReceipt.donorPhone || selectedReceipt.phone || selectedReceipt.donor?.phone || selectedReceipt.user?.phone}
                          </span>
                        </div>
                      )}
                      {selectedReceipt.donorAddress && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium text-right">{selectedReceipt.donorAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedReceipt.campaignName && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Campaign Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Campaign:</span>
                          <span className="font-medium">{selectedReceipt.campaignName}</span>
                        </div>
                        {selectedReceipt.campaignDescription && (
                          <div>
                            <span className="text-gray-600">Description:</span>
                            <p className="font-medium mt-1">{selectedReceipt.campaignDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedReceipt.notes && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Additional Notes</h4>
                      <p className="text-sm text-gray-700">{selectedReceipt.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => handleDownloadPDF(selectedReceipt)}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF Receipt</span>
                  </button>
                  
                  <button
                    onClick={() => setShowReceiptDetail(false)}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
};

export default MobileReceiptsView;