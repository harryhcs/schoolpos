"use client";

import { useState, useTransition } from "react";
import { getSalesReport } from "./functions";

interface Sale {
  id: string;
  total: number;
  amountPaid: number;
  change: number;
  createdAt: string;
  items: {
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
  user: {
    username: string;
  };
}

interface Report {
  sales: Sale[];
  totalSales: number;
  totalItems: number;
  period: {
    start?: Date;
    end?: Date;
  };
}

export function Reports() {
  const [report, setReport] = useState<Report | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  const handleGenerateReport = async () => {
    setError("");
    const startDate = dateRange.start ? new Date(dateRange.start) : undefined;
    const endDate = dateRange.end ? new Date(dateRange.end) : undefined;

    if (startDate && endDate && startDate > endDate) {
      setError("Start date must be before end date");
      return;
    }

    const response = await getSalesReport(startDate, endDate);
    if (response.success) {
      setReport(response.report);
    } else {
      setError(response.error || "Failed to generate report");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sales Reports</h1>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={isPending}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isPending ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
              <p className="text-2xl font-bold">
                ${report.totalSales.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Total Items Sold</h3>
              <p className="text-2xl font-bold">{report.totalItems}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Cashier</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Items</th>
                </tr>
              </thead>
              <tbody>
                {report.sales.map((sale) => (
                  <tr key={sale.id} className="border-t">
                    <td className="px-4 py-2">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{sale.user.username}</td>
                    <td className="px-4 py-2 text-right">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 