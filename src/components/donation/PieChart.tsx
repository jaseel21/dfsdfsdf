"use client";
import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
  const [chartData, setChartData] = useState<ChartData<"pie">>({
    labels: ["Yatheem", "Hafiz", "Building", "General"],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "rgba(52, 211, 153, 0.8)", // Emerald
          "rgba(16, 185, 129, 0.8)", // Green
          "rgba(5, 150, 105, 0.8)",  // Dark Green
          "rgba(4, 120, 87, 0.8)",   // Forest Green
          "rgba(6, 78, 59, 0.8)",    // Very Dark Green
          "rgba(34, 197, 94, 0.8)",  // Lime Green
        ],
        hoverBackgroundColor: [
          "rgba(52, 211, 153, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(5, 150, 105, 1)",
          "rgba(4, 120, 87, 1)",
          "rgba(6, 78, 59, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 2,
        borderColor: "white",
      },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchDonationTypes = async () => {
      try {
        const response = await fetch("/api/chart/pie-chart",
          {
            headers: {
              'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
    },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const { labels, data } = await response.json();

        const total = data.reduce((sum: number, amount: number) => sum + amount, 0);
        setTotalAmount(total);

        setChartData({
          labels,
          datasets: [
            {
              data,
              backgroundColor: [
                "rgba(52, 211, 153, 0.8)", // Emerald
                "rgba(16, 185, 129, 0.8)", // Green
                "rgba(5, 150, 105, 0.8)",  // Dark Green
                "rgba(4, 120, 87, 0.8)",   // Forest Green
                "rgba(6, 78, 59, 0.8)",    // Very Dark Green
                "rgba(34, 197, 94, 0.8)",  // Lime Green
              ],
              hoverBackgroundColor: [
                "rgba(52, 211, 153, 1)",
                "rgba(16, 185, 129, 1)",
                "rgba(5, 150, 105, 1)",
                "rgba(4, 120, 87, 1)",
                "rgba(6, 78, 59, 1)",
                "rgba(34, 197, 94, 1)",
              ],
              borderWidth: 2,
              borderColor: "white",
            },
          ],
        });
        setLoading(false);
      } catch {
        setError("Error loading donation type data");
        setLoading(false);
      }
    };

    fetchDonationTypes();
  }, []);

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 12,
          color: "rgba(0, 0, 0, 0.8)",
          font: {
            size: 11,
            weight: "normal",
            family: "'Inter', sans-serif",
          },
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 10,
          boxHeight: 10,
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
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
          }
        }
      },
    },
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="space-y-1 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Distribution Overview
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading donation data...
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
            Distribution Overview
          </h2>
          <p className="text-sm text-red-500">{error}</p>
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
          Distribution Overview
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total: ₹{totalAmount.toLocaleString('en-IN')} across categories
        </p>
      </div>
      <div className="flex-1 min-h-[300px] flex items-center justify-center">
        <div className="w-full h-full">
          <Pie data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default PieChart;