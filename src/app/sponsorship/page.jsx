"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

// Import components
import { PageHeader } from "@/components/users-section/sponsorship/PageHeader";
import { ThankYouModal } from "@/components/users-section/sponsorship/ThankYouModal";
import { SponsorshipForm } from "@/components/users-section/sponsorship/SponsorshipForm";
import { SponsorshipSelector } from "@/components/users-section/sponsorship/SponsorshipSelector";
import { PhoneOTPVerification } from "@/components/users-section/sponsorship/PhoneOTPVerification";
import SponsorDashboard from "@/components/users-section/sponsorship/SponsorDashboard";

// Import data
import { sponsorshipData } from "@/components/users-section/types";

const SPONSOR_SESSION_KEY = "sponsor_verified_session";

export default function SponsorshipPage() {
  const [activeProgram, setActiveProgram] = useState(null);
  const [activeOption, setActiveOption] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [paymentType, setPaymentType] = useState(null);
  const [splitAmount, setSplitAmount] = useState(undefined);
  const [isExtraExpense, setIsExtraExpense] = useState(false);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);

  // Load session from localStorage on mount (restore phone but don't show dashboard until option selected)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSession = localStorage.getItem(SPONSOR_SESSION_KEY);
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          // Check if session is still valid (not expired - 30 days)
          const sessionAge = Date.now() - session.timestamp;
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          if (sessionAge < thirtyDays) {
            // Restore phone number but don't show dashboard until user selects an option
            setVerifiedPhone(session.phone);
            // Don't set showDashboard here - let handleSponsor decide when to show it
          } else {
            // Session expired, clear it
            localStorage.removeItem(SPONSOR_SESSION_KEY);
          }
        } catch (e) {
          console.error("Error loading session:", e);
          localStorage.removeItem(SPONSOR_SESSION_KEY);
        }
      }
    }
  }, []);

  const handleSponsor = (type, option, withEducation = false) => {
    const finalAmount = withEducation && option.withEducation ? option.withEducation : option.amount;
    
    // Check if amount is 50000 or 30000 (Yatheem sponsorship)
    const requiresOTP = type === "Yatheem" && (finalAmount === 50000 || finalAmount === 30000);
    
    setActiveProgram(type);
    
    // Create an object for the active option
    const activeOpt = {
      ...option,
      finalAmount,
      includesEducation: withEducation,
    };
    
    setActiveOption(activeOpt);

    // If requires OTP, check for existing session first
    if (requiresOTP) {
      // Check if user is already logged in (has valid session)
      if (typeof window !== "undefined") {
        const savedSession = localStorage.getItem(SPONSOR_SESSION_KEY);
        if (savedSession) {
          
          try {
            const session = JSON.parse(savedSession);
            // Check if session is still valid (not expired - 30 days)
            const sessionAge = Date.now() - session.timestamp;
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            if (sessionAge < thirtyDays) {
              // User is logged in, go directly to dashboard
              setVerifiedPhone(session.phone);
              setShowDashboard(true);
              setDashboardRefresh((c) => c + 1);
              
              // Update/create sponsor account with new selected amount
              fetch("/api/sponsorships/create-account", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
                },
                body: JSON.stringify({
                  phone: session.phone,
                  selectedAmount: finalAmount,
                  type: type === "Yatheem" ? "Sponsor-Yatheem" : "Sponsor-Hafiz",
                  period: option.duration,
                }),
              }).catch(error => {
                console.error("Error updating sponsor account:", error);
              });
              
              return; // Exit early, don't reset state
            } else {
              // Session expired, clear it
              localStorage.removeItem(SPONSOR_SESSION_KEY);
            }
          } catch (e) {
            console.error("Error loading session:", e);
            localStorage.removeItem(SPONSOR_SESSION_KEY);
          }
        }
      }
      
      // No valid session found, reset state to show OTP verification
      setShowDashboard(false);
      setVerifiedPhone(null);
    }
  };

  const handleBackToSelection = () => {
    setActiveProgram(null);
    setActiveOption(null);
    // Don't clear verifiedPhone here - keep session active
    setShowDashboard(false);
    setPaymentType(null);
    setSplitAmount(undefined);
    setIsExtraExpense(false);
  };

  const handleOTPVerificationSuccess = async (phoneNumber) => {
    setVerifiedPhone(phoneNumber);
    setShowDashboard(true);
    setDashboardRefresh((c) => c + 1);
    
    // Save session to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(SPONSOR_SESSION_KEY, JSON.stringify({
        phone: phoneNumber,
        timestamp: Date.now(),
      }));
    }
    
    // Create or fetch sponsor account
    try {
      const response = await fetch("/api/sponsorships/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          selectedAmount: activeOption?.finalAmount,
          type: activeProgram === "Yatheem" ? "Sponsor-Yatheem" : "Sponsor-Hafiz",
          period: activeOption?.duration,
        }),
      });
      
      if (!response.ok) {
        console.error("Failed to create sponsor account");
      }
    } catch (error) {
      console.error("Error creating sponsor account:", error);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SPONSOR_SESSION_KEY);
    }
    setVerifiedPhone(null);
    setShowDashboard(false);
    setActiveProgram(null);
    setActiveOption(null);
    setPaymentType(null);
    setSplitAmount(undefined);
  };

  const handlePayNow = (type, customAmount, isExtraExpensePayment = false) => {
    setPaymentType(type);
    setSplitAmount(customAmount);
    setIsExtraExpense(isExtraExpensePayment);
    setShowDashboard(false);
  };

  const handleSubmitSuccess = () => {
    setShowThankYou(true);
    
    // Reset form after delay and redirect to dashboard
    setTimeout(() => {
      setShowThankYou(false);
      if (verifiedPhone) {
        setShowDashboard(true);
        setPaymentType(null);
        setSplitAmount(undefined);
        setIsExtraExpense(false);
        setDashboardRefresh((c) => c + 1);
      } else {
        setActiveProgram(null);
        setActiveOption(null);
      }
    }, 3000);
  };

  const handleCloseThankYou = () => {
    setShowThankYou(false);
  };

  // Check if current selection requires OTP
  const requiresOTP = activeProgram === "Yatheem" && activeOption && 
    (activeOption.finalAmount === 50000 || activeOption.finalAmount === 30000);

  return (
    <>
      {/* Page Header Component */}
      <PageHeader 
        title="Sponsorship Programs" 
        description="Provide sustained support through our sponsorship programs. Your regular contributions create stability and lasting change."
      />

      <section className="py-16 px-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto max-w-6xl">
          {/* Thank You Modal Component */}
          <AnimatePresence>
            <ThankYouModal 
              show={showThankYou} 
              onClose={handleCloseThankYou} 
            />
          </AnimatePresence>
          
          {/* Conditional Rendering based on selection state */}
          {activeProgram && activeOption ? (
            requiresOTP ? (
              paymentType ? (
                // After verification, allow direct payment form (complete or split)
                <SponsorshipForm
                  activeProgram={activeProgram}
                  activeOption={{
                    ...activeOption,
                    finalAmount: paymentType === "split" && splitAmount ? splitAmount : activeOption.finalAmount,
                  }}
                  sponsorPhoneNumber={verifiedPhone}
                  selectedAmount={activeOption.finalAmount}
                  paymentType={isExtraExpense ? "extra" : "main"}
                  onBack={() => {
                    setPaymentType(null);
                    setSplitAmount(undefined);
                    setIsExtraExpense(false);
                    setShowDashboard(true);
                  }}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              ) : verifiedPhone && showDashboard ? (
                // Show dashboard if verified and not paying right now
                <SponsorDashboard
                  phoneNumber={verifiedPhone}
                  selectedAmount={activeOption.finalAmount}
                  period={activeOption.duration}
                  refreshKey={dashboardRefresh}
                  onPayNow={handlePayNow}
                  onLogout={handleLogout}
                />
              ) : (
                // First-time OTP verification step
                <PhoneOTPVerification
                  onVerificationSuccess={handleOTPVerificationSuccess}
                  onBack={handleBackToSelection}
                />
              )
            ) : (
              // Non-OTP flows
              paymentType ? (
                <SponsorshipForm
                  activeProgram={activeProgram}
                  activeOption={{
                    ...activeOption,
                    finalAmount: paymentType === "split" && splitAmount ? splitAmount : activeOption.finalAmount,
                  }}
                  onBack={() => {
                    setPaymentType(null);
                    setSplitAmount(undefined);
                    setShowDashboard(true);
                  }}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              ) : (
                <SponsorshipForm
                  activeProgram={activeProgram}
                  activeOption={activeOption}
                  onBack={handleBackToSelection}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              )
            )
          ) : (
            <SponsorshipSelector 
              sponsorships={sponsorshipData}
              onSelect={handleSponsor}
            />
          )}
        </div>
      </section>
    </>
  );
}