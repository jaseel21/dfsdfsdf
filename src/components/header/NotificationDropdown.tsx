"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface Activity {
  id: string;
  type: string;
  title: string;
  message: string;
  timeAgo: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  user?: string;
  amount?: number;
  location?: string;
  phone?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent activities
  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/recent-activities?limit=8', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
        setNotifying(data.activities.length > 0);
      } else {
        throw new Error(data.message || 'Failed to fetch activities');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities on component mount and set up auto-refresh
  useEffect(() => {
    fetchActivities();
    
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(fetchActivities, 2 * 60 * 1000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Get icon for activity type
  const getActivityIcon = (_type: string, icon: string) => {
    const iconClasses = "w-5 h-5";
    
    switch (icon) {
      case 'donation':
        return (
          <div className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl p-2.5 group-hover:scale-105 transition-transform">
            <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'notification':
        return (
          <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl p-2.5 group-hover:scale-105 transition-transform">
            <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM8.503 20.498l7.497-7.497M18 2l4 4-8 8-4-4 8-8z" />
            </svg>
          </div>
        );
      case 'box':
        return (
          <div className="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl p-2.5 group-hover:scale-105 transition-transform">
            <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
        );
      case 'volunteer':
        return (
          <div className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl p-2.5 group-hover:scale-105 transition-transform">
            <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'star':
        return (
          <div className="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl p-2.5 group-hover:scale-105 transition-transform">
            <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-xl p-2.5 group-hover:scale-105 transition-transform">
            <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    if (!isOpen) {
      fetchActivities(); // Refresh data when opening
    }
    setNotifying(false);
  };
  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {(notifying && activities.length > 0) && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        {activities.length > 0 && (
          <span className="absolute -top-1 -right-1 z-10 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {activities.length > 9 ? '9+' : activities.length}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[500px] w-[380px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-dark sm:w-[400px] lg:right-0 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5zM8.503 20.498l7.497-7.497M18 2l4 4-8 8-4-4 8-8z"
                />
              </svg>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Recent Activities
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live updates from your system
              </p>
            </div>
          </div>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Main content area with flex-1 to take remaining space */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ul className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
            {loading ? (
              <li className="p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-gray-500 text-sm">Loading activities...</p>
                </div>
              </li>
            ) : error ? (
              <li className="p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Failed to load activities</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{error}</p>
                  </div>
                  <button
                    onClick={fetchActivities}
                    className="mt-2 px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </li>
            ) : activities.length === 0 ? (
              <li className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">No recent activities</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      Activities will appear here when they occur
                    </p>
                  </div>
                </div>
              </li>
            ) : (
              activities.map((activity) => (
                <li key={activity.id}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-xl border border-transparent p-3 hover:bg-gray-50 hover:border-gray-100 dark:hover:bg-gray-800/50 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type, activity.icon)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                            {activity.title}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 line-clamp-2">
                            {activity.message}
                          </p>
                        </div>
                        {activity.priority === 'high' && (
                          <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1"></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">
                          {activity.type.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {activity.timeAgo}
                        </span>
                      </div>
                    </div>
                  </DropdownItem>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Fixed footer with buttons */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2">
            <Link
              href="/admin/notifications"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-center text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              onClick={closeDropdown}
            >
              View All Activities
            </Link>
            <button
              onClick={fetchActivities}
              disabled={loading}
              className="px-3 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors group"
              title="Refresh activities"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </Dropdown>
    </div>
  );
}
