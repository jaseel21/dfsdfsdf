'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { useRouter } from 'next/navigation';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

auth.useDeviceLanguage();

// Enable test mode if specified
const isTestMode = process.env.NEXT_PUBLIC_FIREBASE_TEST_MODE === 'true';
if (isTestMode) {
  console.log('Test mode is on! No real SMS will be sent.');
  try {
    auth.settings.appVerificationDisabledForTesting = true;
    console.log('appVerificationDisabledForTesting set to true');
  } catch (err) {
    console.error('Error setting appVerificationDisabledForTesting:', err);
  }
}

export default function SignInForm() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(isTestMode);
  const [detectedRole, setDetectedRole] = useState(null);
  const [recaptchaRetryCount, setRecaptchaRetryCount] = useState(0);
  const router = useRouter();
  const otpInputs = useRef([]);

  // Generate unique container ID to avoid conflicts
  const generateContainerId = () => {
    return `recaptcha-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Clean up existing reCAPTCHA
  const cleanupRecaptcha = useCallback(() => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (err) {
        console.log('Error clearing reCAPTCHA:', err);
      }
      window.recaptchaVerifier = null;
    }
    
    // Remove all existing reCAPTCHA containers
    const existingContainers = document.querySelectorAll('[id^="recaptcha-container"]');
    existingContainers.forEach(container => {
      try {
        container.remove();
      } catch (err) {
        console.log('Error removing container:', err);
      }
    });
  }, []);

  // Initialize reCAPTCHA with fresh container
  const initializeRecaptcha = useCallback(async () => {
    if (isTestMode) {
      setRecaptchaReady(true);
      return;
    }

    try {
      // Clean up any existing reCAPTCHA
      cleanupRecaptcha();

      // Generate new container ID
      const newContainerId = generateContainerId();

      // Create new container
      const container = document.createElement('div');
      container.id = newContainerId;
      container.className = 'hidden';
      document.body.appendChild(container);

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new verifier
      window.recaptchaVerifier = new RecaptchaVerifier(auth, newContainerId, {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha verified');
          setRecaptchaReady(true);
          setError(''); // Clear any previous errors
        },
        'expired-callback': () => {
          console.log('Recaptcha expired. Reinitializing...');
          setRecaptchaReady(false);
          setError('reCAPTCHA expired. Reinitializing...');
          // Auto-reinitialize after expiration
          setTimeout(() => {
            // Use a fresh call to avoid circular dependency
            const reinitialize = async () => {
              try {
                cleanupRecaptcha();
                const container = document.createElement('div');
                container.id = generateContainerId();
                container.className = 'hidden';
                document.body.appendChild(container);
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
                window.recaptchaVerifier = new RecaptchaVerifier(auth, container.id, {
                  size: 'invisible',
                  callback: () => {
                    setRecaptchaReady(true);
                    setError('');
                  },
                  'expired-callback': () => {
                    setRecaptchaReady(false);
                    setError('reCAPTCHA expired. Please refresh the page.');
                  },
                });
                
                await window.recaptchaVerifier.render();
                setRecaptchaReady(true);
                setError('');
              } catch (err) {
                console.error('Error reinitializing reCAPTCHA:', err);
                setError('reCAPTCHA failed to reinitialize. Please refresh the page.');
              }
            };
            reinitialize();
          }, 1000);
        },
      });

      await window.recaptchaVerifier.render();
      setRecaptchaReady(true);
      setError(''); // Clear any previous errors
      setRecaptchaRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error initializing reCAPTCHA:', err);
      setRecaptchaReady(false);
      
      // Retry with new container after 2 seconds
      if (recaptchaRetryCount < 3) {
        setRecaptchaRetryCount(prev => prev + 1);
        setError('reCAPTCHA initialization failed. Retrying...');
        
        setTimeout(() => {
          // Use a fresh call to avoid circular dependency
          const retry = async () => {
            try {
              cleanupRecaptcha();
              const container = document.createElement('div');
              container.id = generateContainerId();
              container.className = 'hidden';
              document.body.appendChild(container);
              
              await new Promise(resolve => setTimeout(resolve, 100));
              
              window.recaptchaVerifier = new RecaptchaVerifier(auth, container.id, {
                size: 'invisible',
                callback: () => {
                  setRecaptchaReady(true);
                  setError('');
                },
                'expired-callback': () => {
                  setRecaptchaReady(false);
                  setError('reCAPTCHA expired. Please refresh the page.');
                },
              });
              
              await window.recaptchaVerifier.render();
              setRecaptchaReady(true);
              setError('');
            } catch (retryErr) {
              console.error('Error retrying reCAPTCHA:', retryErr);
              setError('reCAPTCHA retry failed. Please refresh the page.');
            }
          };
          retry();
        }, 2000);
      } else {
        setError('reCAPTCHA failed to initialize. Please try again later.');
        setRecaptchaRetryCount(0);
      }
    }
  }, [recaptchaRetryCount, cleanupRecaptcha]);

  // Setup reCAPTCHA verifier
  useEffect(() => {
    initializeRecaptcha();

    return () => {
      cleanupRecaptcha();
    };
  }, [initializeRecaptcha, cleanupRecaptcha]);

  // Update formatted phone
  useEffect(() => {
    if (phoneNumber) {
      setFormattedPhone(`+91${phoneNumber}`);
    } else {
      setFormattedPhone('');
    }
  }, [phoneNumber]);

  // Handle phone number input
  const handlePhoneInput = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    setPhoneNumber(digitsOnly.slice(0, 10));
  };

  // Handle OTP input
  const handleOtpInput = (index, value) => {
    const newOtp = [...otp];
    const digit = value.replace(/\D/g, '');
    newOtp[index] = digit.slice(0, 1);
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputs.current[index + 1].focus();
    }
  };

  // Handle OTP key events
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  // Handle phone number submission
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDetectedRole(null);

    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/check-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
        },
        body: JSON.stringify({ phone: formattedPhone,role:'Admin' }),
      });

      let data;
      try {
        data = await response.json();
        console.log('Response from /api/check-phone:', data);
      } catch (jsonErr) {
        console.error('Error parsing response JSON:', jsonErr);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check phone number');
      }

      if (!data.exists) {
        throw new Error('Phone number not registered as admin');
      }

      // Set the detected role
      setDetectedRole(data.role);

      console.log('Attempting to send OTP to:', formattedPhone);
      
      // Handle reCAPTCHA for non-test mode
      let appVerifier;
      if (!isTestMode) {
        // Check if reCAPTCHA is ready, if not, reinitialize
        if (!window.recaptchaVerifier || !recaptchaReady) {
          setError('Initializing reCAPTCHA...');
          await initializeRecaptcha();
        }
        
        if (!window.recaptchaVerifier) {
          throw new Error('reCAPTCHA failed to initialize. Please try again.');
        }
        
        appVerifier = window.recaptchaVerifier;
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      console.log('signInWithPhoneNumber result:', result);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!confirmationResult) {
      setError('Something went wrong. Try entering your phone number again.');
      setLoading(false);
      return;
    }

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      
      console.log('Verifying OTP:', otpString);
      const credential = await confirmationResult.confirm(otpString);
      console.log('User verified:', credential.user);

      const idToken = await credential.user.getIdToken();
      console.log('Firebase ID Token:', idToken);

      const result = await signIn('credentials', {
        redirect: false,
        idToken,
        phone: formattedPhone,
        role: detectedRole,
      });

      console.log("Sign-in result:", result);
     

      if (!result || result.error) {
        throw new Error(result?.error || 'Unknown error occurred during sign-in.');
      }

    
      router.push('/admin');
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form and reCAPTCHA
  const resetForm = () => {
    setOtpSent(false);
    setError('');
    setOtp(['', '', '', '', '', '']);
    setDetectedRole(null);
    
    // Reinitialize reCAPTCHA for fresh login attempt
    if (!isTestMode) {
      // Create a fresh reCAPTCHA instance without calling the memoized function
      const freshInit = async () => {
        try {
          cleanupRecaptcha();
          const container = document.createElement('div');
          container.id = generateContainerId();
          container.className = 'hidden';
          document.body.appendChild(container);
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          window.recaptchaVerifier = new RecaptchaVerifier(auth, container.id, {
            size: 'invisible',
            callback: () => {
              setRecaptchaReady(true);
              setError('');
            },
            'expired-callback': () => {
              setRecaptchaReady(false);
              setError('reCAPTCHA expired. Please refresh the page.');
            },
          });
          
          await window.recaptchaVerifier.render();
          setRecaptchaReady(true);
          setError('');
        } catch (err) {
          console.error('Error reinitializing reCAPTCHA:', err);
          setError('reCAPTCHA failed to reinitialize. Please refresh the page.');
        }
      };
      freshInit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-25 via-blue-light-25 to-gray-25 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-light-100 to-blue-light-200 opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-brand-50 to-blue-light-50 opacity-10 blur-3xl"></div>
      </div>
      
      <div className="relative max-w-md w-full">
        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-theme-xl border border-white/20 overflow-hidden">
          {/* Header section with gradient */}
          <div className="relative bg-gradient-to-r from-brand-600 to-brand-500 px-8 pt-8 pb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600/90 to-brand-500/90"></div>
            <div className="relative text-center">
              {/* Logo/Icon */}
              <div className="mx-auto h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
              <p className="text-brand-100 text-sm font-medium">Secure access for administrators</p>
            </div>
            {/* Decorative wave */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg className="w-full h-4 text-white" preserveAspectRatio="none" viewBox="0 0 1200 120" fill="currentColor">
                <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
                <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
                <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
              </svg>
            </div>
          </div>

          {/* Form content */}
          <div className="px-8 py-8">

        {!otpSent ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-3">
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="flex rounded-2xl shadow-theme-sm border border-gray-200 group-focus-within:border-brand-300 group-focus-within:shadow-focus-ring transition-all duration-200 bg-white">
                    <span className="inline-flex items-center px-4 py-4 rounded-l-2xl bg-gray-50 border-r border-gray-200 text-gray-600 text-sm font-medium">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneInput(e.target.value)}
                      placeholder="Enter your phone number"
                      required
                      maxLength={10}
                      className="block w-full px-4 py-4 border-0 rounded-r-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </div>
                </div>
                {isTestMode && (
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-blue-light-400"></div>
                    <p className="text-sm text-blue-light-600 font-medium">
                      Test mode: Use a test number from Firebase Console
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (!isTestMode && !recaptchaReady) || phoneNumber.length !== 10}
              className={`w-full group relative flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl text-sm font-semibold transition-all duration-200 shadow-theme-md
                ${loading || (!isTestMode && !recaptchaReady) || phoneNumber.length !== 10
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-theme-lg hover:shadow-theme-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (!isTestMode && !recaptchaReady) ? (
                <>
                  <svg className="animate-pulse -ml-1 mr-3 h-5 w-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>Loading Security...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            {error && (
              <div className="relative rounded-2xl bg-gradient-to-r from-error-50 to-error-25 border border-error-200 p-4 shadow-theme-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-error-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            {detectedRole && (
              <div className="relative rounded-2xl bg-gradient-to-r from-blue-light-50 to-blue-light-25 border border-blue-light-200 p-4 shadow-theme-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-light-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-light-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-light-700">
                      Access Level: <span className="text-blue-light-800">{detectedRole}</span>
                    </p>
                    <p className="text-xs text-blue-light-600 mt-1">Role verified successfully</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="text-center">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Enter Verification Code
                </label>
                <p className="text-sm text-gray-500 mb-6">
                  We&apos;ve sent a 6-digit code to <span className="font-medium text-gray-700">{formattedPhone}</span>
                </p>
              </div>
              
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <div key={index} className="relative group">
                    <input
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpInput(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      ref={(el) => (otpInputs.current[index] = el)}
                      maxLength={1}
                      className="w-14 h-14 text-center text-lg font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 shadow-theme-sm hover:border-gray-300"
                    />
                    {digit && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 opacity-10 pointer-events-none"></div>
                    )}
                  </div>
                ))}
              </div>
              
              {isTestMode && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-blue-light-400"></div>
                  <p className="text-sm text-blue-light-600 font-medium">
                    Test mode: Use test OTP like 123456
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className={`w-full group relative flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl text-sm font-semibold transition-all duration-200 shadow-theme-md
                ${loading || otp.join('').length !== 6
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-success-600 to-success-500 hover:from-success-700 hover:to-success-600 text-white shadow-theme-lg hover:shadow-theme-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Verify & Sign In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center text-sm text-gray-600 hover:text-brand-600 transition-colors duration-200 font-medium"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Use different number
              </button>
              <button
                type="button"
                disabled={loading}
                className="flex items-center text-sm text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Resend code
              </button>
            </div>

            {error && (
              <div className="relative rounded-2xl bg-gradient-to-r from-error-50 to-error-25 border border-error-200 p-4 shadow-theme-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-error-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 pt-6 pb-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              Protected by enterprise-grade security
            </p>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="h-6 w-6 rounded bg-gradient-to-r from-brand-500 to-brand-400 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">AIC Amal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}