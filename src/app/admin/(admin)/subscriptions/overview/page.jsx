"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, DollarSign, TrendingUp, TrendingDown,
  Calendar, BarChart3, PieChart, Activity, AlertCircle,
  RefreshCcw, Eye, ChevronRight, Clock, CheckCircle,
  XCircle, Pause, CreditCard, UserCheck, UserX,
  ArrowUp, ArrowDown, Minus
} from "lucide-react";
import { useSession } from "next-auth/react";
import NoAccess from "@/components/NoAccess";

export default function SubscriptionsOverviewPage() {
  const { data: session, status } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";
  const hasPermission = isSuperAdmin || (session?.user?.permissions?.includes("subscriptions_overview") || session?.user?.permissions?.includes("*"));
  
  if (status === "loading") return null;
  if (!hasPermission) return <NoAccess />;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    overview: {
      total: 0,
      active: 0,
      cancelled: 0,
      auto: 0,
      manual: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      subscriberGrowth: 0,
      revenueGrowth: 0
    },
    paymentStatus: { paid: 0, pending: 0 },
    periods: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
    recentActivity: { newSubscriptions: 0, recentReactivations: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use the new analytics API
        const response = await fetch("/api/subscriptions/analytics", {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
          }
        });
        
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const data = await response.json();
        
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          throw new Error(data.error || "Failed to fetch analytics");
        }
        
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = "blue" }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === "up" ? "text-green-600 dark:text-green-400" : 
              trend === "down" ? "text-red-600 dark:text-red-400" : 
              "text-gray-600 dark:text-gray-400"
            }`}>
              {trend === "up" && <ArrowUp className="h-4 w-4 mr-1" />}
              {trend === "down" && <ArrowDown className="h-4 w-4 mr-1" />}
              {trend === "neutral" && <Minus className="h-4 w-4 mr-1" />}
              <span>{trendValue}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCcw className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-400" />
          <span className="text-gray-600 dark:text-gray-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Error Loading Data</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and insights</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Subscriptions"
          value={analytics.overview.total.toLocaleString()}
          icon={Users}
          trend={analytics.overview.subscriberGrowth > 0 ? "up" : analytics.overview.subscriberGrowth < 0 ? "down" : "neutral"}
          trendValue={Math.abs(analytics.overview.subscriberGrowth).toFixed(1)}
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={analytics.overview.active.toLocaleString()}
          subtitle={analytics.overview.total > 0 ? `${((analytics.overview.active / analytics.overview.total) * 100).toFixed(1)}% of total` : "0% of total"}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${analytics.overview.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={analytics.overview.revenueGrowth > 0 ? "up" : analytics.overview.revenueGrowth < 0 ? "down" : "neutral"}
          trendValue={Math.abs(analytics.overview.revenueGrowth).toFixed(1)}
          color="purple"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${analytics.overview.monthlyRevenue.toLocaleString()}`}
          subtitle="This month"
          icon={TrendingUp}
          color="indigo"
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Auto Subscriptions"
          value={analytics.overview.auto.toLocaleString()}
          subtitle={analytics.overview.total > 0 ? `${((analytics.overview.auto / analytics.overview.total) * 100).toFixed(1)}% of total` : "0% of total"}
          icon={CreditCard}
          color="green"
        />
        <StatCard
          title="Manual Subscriptions"
          value={analytics.overview.manual.toLocaleString()}
          subtitle={analytics.overview.total > 0 ? `${((analytics.overview.manual / analytics.overview.total) * 100).toFixed(1)}% of total` : "0% of total"}
          icon={UserCheck}
          color="blue"
        />
        <StatCard
          title="Cancelled"
          value={analytics.overview.cancelled.toLocaleString()}
          subtitle={analytics.overview.total > 0 ? `${((analytics.overview.cancelled / analytics.overview.total) * 100).toFixed(1)}% cancellation rate` : "0% cancellation rate"}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Average Revenue"
          value={analytics.overview.total > 0 ? `₹${Math.round(analytics.overview.totalRevenue / analytics.overview.total).toLocaleString()}` : "₹0"}
          subtitle="Per subscription"
          icon={BarChart3}
          color="yellow"
        />
      </div>

      {/* Subscription Types & Payment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Methods</h3>
            <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Auto Subscriptions</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.overview.auto.toLocaleString()}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.overview.auto / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Manual Subscriptions</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.overview.manual.toLocaleString()}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.overview.manual / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <Link
                href="/admin/subscriptions/auto"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                View Auto <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
              <Link
                href="/admin/subscriptions/manual"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                View Manual <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Status</h3>
            <PieChart className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Paid</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.paymentStatus.paid.toLocaleString()}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.paymentStatus.paid / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">Pending</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.paymentStatus.pending.toLocaleString()}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.paymentStatus.pending / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-gray-700 dark:text-gray-300">Cancelled</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.overview.cancelled.toLocaleString()}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.overview.cancelled / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Periods</h3>
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Daily</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.periods.daily}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.periods.daily / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Weekly</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.periods.weekly}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.periods.weekly / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Monthly</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.periods.monthly}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.periods.monthly / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Yearly</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{analytics.periods.yearly}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.overview.total > 0 ? ((analytics.periods.yearly / analytics.overview.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
            <Activity className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/admin/subscriptions/list"
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">View All Subscriptions</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
            <Link
              href="/admin/subscriptions/auto"
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white">Auto Subscriptions</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
            <Link
              href="/admin/subscriptions/manual"
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">Manual Subscriptions</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
            <Link
              href="/admin/subscriptions/cancelled"
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-gray-900 dark:text-white">Cancelled Subscriptions</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}