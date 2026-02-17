import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface DashboardStats {
  totalRevenue: number;
  activeUsers: number;
  totalTransactions: number;
  successRate: number;
  avgResponseTime: number;
  systemHealth: "healthy" | "degraded" | "down";
}

export default function Dashboard() {
  const { data: DashboardStats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await api.get("/monitoring/system/stats");
      return response.data;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-600">
          Overview of your tenant performance
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
              <p className="text-sm text-gray-500">${format(data.totalRevenue, { style: "currency: "USD" })}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Active Users</h3>
              <p className="text-sm text-gray-500">{data.activeUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Success Rate</h3>
              <p className="text-sm text-gray-500">{data.successRate}%</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Avg Response Time</h3>
              <p className="text-sm text-gray-500">{data.avgResponseTime}ms</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="space-y-4">
          <button className="btn-primary">
            Create Invoice
          </button>
          <button className="btn-secondary">
            View Reports
          </button>
          <button className="btn-secondary">
            Export Data
          </button>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Payment received</p>
              <p className="text-xs text-gray-500">$2,450.00</p>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">New user onboarded</p>
              <p className="text-xs text-gray-500">John Doe</p>
            </div>
            <span className="text-xs text-gray-500">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
