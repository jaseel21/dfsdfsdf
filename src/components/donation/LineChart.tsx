"use client";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const LineChart = () => {
  const [chartData, setChartData] = useState<ChartData<"line">>({
    labels: [],
    datasets: [
      {
        label: "Weekly Donations (₹)",
        data: [],
        fill: true,
        backgroundColor: "rgba(52, 211, 153, 0.1)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgba(16, 185, 129, 1)",
        pointHoverBorderColor: "white",
        pointHoverBorderWidth: 2,
      },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendMetrics, setTrendMetrics] = useState({
    totalAmount: 0,
    averageWeekly: 0,
    growthRate: 0
  });

  useEffect(() => {
    const fetchDonationTrends = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/chart/donation-trends", {
          headers: {
            'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch donation trends");
        }

        const { labels, amounts, totalAmount, averageWeekly, growthRate } = await response.json();

        setChartData({
          labels,
          datasets: [
            {
              label: "Weekly Donations (₹)",
              data: amounts,
              fill: true,
              backgroundColor: "rgba(52, 211, 153, 0.1)",
              borderColor: "rgba(16, 185, 129, 1)",
              borderWidth: 2,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "rgba(16, 185, 129, 1)",
              pointBorderColor: "white",
              pointBorderWidth: 2,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: "rgba(16, 185, 129, 1)",
              pointHoverBorderColor: "white",
              pointHoverBorderWidth: 2,
            },
          ],
        });

        setTrendMetrics({
          totalAmount,
          averageWeekly,
          growthRate
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching donation trends:", err);
        setError("Failed to load donation trends");
        setLoading(false);
      }
    };

    fetchDonationTrends();
  }, []);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          color: "rgba(0, 0, 0, 0.8)",
          font: {
            size: 12,
            weight: "bold",
            family: "'Inter', sans-serif",
          },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif",
        },
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `Donations: ₹${context.parsed.y.toLocaleString('en-IN')}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "rgba(0, 0, 0, 0.6)",
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.06)",
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "rgba(0, 0, 0, 0.6)",
          callback: function(value) {
            return '₹' + Number(value).toLocaleString('en-IN');
          }
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="space-y-1 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Donation Trends
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading trend data...
          </p>
        </div>
        <div className="flex-1 min-h-[300px] animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="space-y-1 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Donation Trends
          </h2>
          <p className="text-sm text-red-500">
            {error}
          </p>
        </div>
        <div className="flex-1 min-h-[300px] flex items-center justify-center">
          <p className="text-gray-500">Unable to load chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-1 mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Donation Trends
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Weekly growth: {trendMetrics.growthRate > 0 ? '+' : ''}{trendMetrics.growthRate}%</span>
          <span>Avg: ₹{Math.round(trendMetrics.averageWeekly).toLocaleString('en-IN')}/week</span>
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default LineChart;
