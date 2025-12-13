"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { sendOTP, setupRecaptcha, clearRecaptcha } from "@/lib/firebase";
import type { ConfirmationResult } from "firebase/auth";

interface PhoneOTPVerificationProps {
  onVerificationSuccess: (phoneNumber: string) => void;
  onBack?: () => void;
}

export const PhoneOTPVerification = ({ onVerificationSuccess, onBack }: PhoneOTPVerificationProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setupRecaptcha("recaptcha-container");
    return () => {
      clearRecaptcha();
    };
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    try {
      // Ensure reCAPTCHA is ready before sending OTP
      const recaptchaReady = await setupRecaptcha("recaptcha-container");
      if (!recaptchaReady) {
        throw new Error("Unable to load verification. Please check your connection and refresh.");
      }

      const result = await sendOTP(phoneNumber);
      if (result) {
        setConfirmationResult(result);
        setStep("otp");
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      const message = err?.message || "";
      if (message.includes("network-request-failed")) {
        setError(
          "Network error while contacting verification service. Check internet connection and allow access to firebase/google domains."
        );
      } else {
        setError(message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter a complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otpValue);
        onVerificationSuccess(phoneNumber);
      } else {
        setError("OTP session expired. Please request a new OTP.");
        setStep("phone");
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setIsLoading(true);
    try {
      const result = await sendOTP(phoneNumber);
      if (result) {
        setConfirmationResult(result);
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-indigo-100 dark:border-gray-700">
      <div id="recaptcha-container"></div>
      {step === "phone" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-indigo-900 dark:text-gray-100 mb-2">
              Phone Verification
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your phone number to continue with sponsorship
            </p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-indigo-800 dark:text-gray-200 font-medium mb-2">
                Phone Number
              </label>
              <div className="flex items-center">
                <span className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-l-lg border border-r-0 border-indigo-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhoneNumber(value);
                    setError("");
                  }}
                  className="flex-1 p-3 border border-indigo-200 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  required
                  maxLength={10}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 px-4 py-3 border-2 border-indigo-200 dark:border-gray-600 text-indigo-700 dark:text-gray-300 rounded-lg font-medium hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
              )}
              <motion.button
                type="submit"
                disabled={isLoading || phoneNumber.length !== 10}
                whileHover={{ scale: isLoading || phoneNumber.length !== 10 ? 1 : 1.02 }}
                whileTap={{ scale: isLoading || phoneNumber.length !== 10 ? 1 : 0.98 }}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 dark:hover:from-indigo-600 hover:to-purple-700 dark:hover:to-purple-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-indigo-900 dark:text-gray-100 mb-2">
              Enter OTP
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a verification code to <span className="font-medium">+91 {phoneNumber}</span>
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-indigo-800 dark:text-gray-200 font-medium mb-2">
                Verification Code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-indigo-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="flex-1 px-4 py-3 border-2 border-indigo-200 dark:border-gray-600 text-indigo-700 dark:text-gray-300 rounded-lg font-medium hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
              >
                Change Number
              </button>
              <motion.button
                type="submit"
                disabled={isLoading || otp.some((d) => !d)}
                whileHover={{ scale: isLoading || otp.some((d) => !d) ? 1 : 1.02 }}
                whileTap={{ scale: isLoading || otp.some((d) => !d) ? 1 : 0.98 }}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 dark:hover:from-indigo-600 hover:to-purple-700 dark:hover:to-purple-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify OTP"
                )}
              </motion.button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50"
              >
                Didn't receive OTP? Resend
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

