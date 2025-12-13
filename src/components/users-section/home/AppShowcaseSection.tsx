"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function AppShowcaseSection() {
  return (
    <section className="relative bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 py-16 lg:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200/30 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-pink-200/30 dark:bg-pink-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium">
                📱 Mobile App Available
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                AIC Amal
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Mobile App
                </span>
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Experience seamless donations and stay connected with our community through the AIC Amal mobile app. 
                Access all features on-the-go with our intuitive and user-friendly interface designed for modern giving.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Quick Donations</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Fast & secure payments</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Digital Receipts</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Instant documentation</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Easy Interface</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">User-friendly design</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">24/7 Support</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Always here to help</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* App Store Buttons */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Download now and start making a difference:</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="https://apps.apple.com/us/app/aic-amal/id6743961924"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center px-6 py-3 bg-black hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">Download on the</div>
                      <div className="text-lg font-semibold">App Store</div>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  href="https://play.google.com/store/apps/details?id=com.aic.amal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center px-6 py-3 bg-black hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">Get it on</div>
                      <div className="text-lg font-semibold">Google Play</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">5★</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">App Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">1K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
              </div>
            </div>
          </div>
          
          {/* Right Content - Phone Mockups */}
          <div className="relative lg:pl-8">
            <div className="relative max-w-xs mx-auto lg:max-w-none">
              {/* Primary Phone with Real App Image */}
              <div className="relative z-20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="relative max-w-[280px] mx-auto">
                  {/* App Mockup Image - No container, let the natural phone shape show */}
                  <Image
                    src="/amal app mockup for web.webp"
                    alt="AIC Amal Mobile App Interface"
                    width={280}
                    height={420}
                    className="w-full h-auto object-cover drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
              
              {/* Secondary Phone (Background) */}
              <div className="absolute top-6 -right-4 z-10 transform -rotate-12 opacity-40">
                <div className="relative">
                  <div className="relative bg-gray-900 dark:bg-gray-700 rounded-[1.5rem] p-2 shadow-xl scale-60">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-[1rem] overflow-hidden">
                      <div className="h-[360px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <div className="text-center space-y-2 opacity-60">
                          <div className="w-10 h-10 bg-purple-200 dark:bg-purple-800 rounded-full mx-auto flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-300 text-sm">📱</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">AIC Amal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-purple-200/40 dark:bg-purple-600/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-pink-200/40 dark:bg-pink-600/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}