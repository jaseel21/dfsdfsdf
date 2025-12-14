"use client"
import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const BarChart = () => {
  const [chartData, setChartData] = useState<ChartData<"bar">>({
    labels: [],
    datasets: [
      {
        label: "Donations (₹)",
        data: [],
        backgroundColor: "rgba(52, 211, 153, 0.8)",
        hoverBackgroundColor: "rgba(16, 185, 129, 1)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 'flex',
        maxBarThickness: 32,
      },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchMonthlyDonations = async () => {
      try {
        const response = await fetch("/api/chart/monthly-donations", {
          headers: {
            'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch monthly donations data");
        }

        const { labels, data, total } = await response.json();

        setChartData({
          labels,
          datasets: [
            {
              label: "Donations (₹)",
              data,
              backgroundColor: "rgba(52, 211, 153, 0.8)",
              hoverBackgroundColor: "rgba(16, 185, 129, 1)",
              borderColor: "rgba(16, 185, 129, 1)",
              borderWidth: 1,
              borderRadius: 6,
              barThickness: 'flex',
              maxBarThickness: 32,
            },
          ],
        });
        
        setTotalAmount(total);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching monthly donations:', err);
        setError("Failed to load monthly donation data");
        setLoading(false);
      }
    };

    fetchMonthlyDonations();
  }, []);

  const options: ChartOptions<"bar"> = {
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
            return `₹${context.parsed.y.toLocaleString('en-IN')}`;
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
        beginAtZero: true,
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
            Monthly Donations
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
            Monthly Donations
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
          Monthly Donations
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Last 7 months • Total: ₹{totalAmount.toLocaleString('en-IN')}
        </p>
      </div>
      <div className="flex-1 min-h-[300px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BarChart;