"use client";

import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import DashboardOverview from "./DashboardOverview";
import SystemStatus from "./SystemStatus";
import AlertsPanel from "./AlertsPanel";
import QuickActions from "./QuickActions";
import UsageMetrics from "./UsageMetrics";
import DateRangeFilter from "./DateRangeFilter";
import SecurityPanel from "./SecurityPanel";
import DataIntelligence from "./DataIntelligence";
import { Settings, Moon, Sun, Layout } from "lucide-react";

export default function EnhancedDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showSecurity, setShowSecurity] = useState(false);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
    // Refresh dashboard data with new date range
  };

  const handleExport = (format: "csv" | "pdf") => {
    // Export dashboard data
    console.log(`Exporting as ${format}`);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Apply dark mode styles
    document.documentElement.classList.toggle("dark");
  };

  return (
    <DashboardLayout title="Enhanced Dashboard">
      <div className="space-y-6">
        {/* Date Range Filter */}
        <DateRangeFilter
          onDateRangeChange={handleDateRangeChange}
          onExport={handleExport}
        />

        {/* Top Row - Critical Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Status */}
          <SystemStatus />

          {/* Alerts Panel */}
          <AlertsPanel />

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Usage Metrics */}
        <UsageMetrics />

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Original Dashboard Overview */}
          <div className="lg:col-span-2">
            <DashboardOverview />
          </div>

          {/* Security Panel */}
          <div className="lg:col-span-1">
            <SecurityPanel />
          </div>
        </div>

        {/* Data Intelligence */}
        <DataIntelligence />

        {/* Floating Controls */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-3 bg-white rounded-full shadow-lg hover:shadow-lg transition-shadow border border-gray-200"
            title="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSecurity(!showSecurity)}
            className="p-3 bg-white rounded-full shadow-lg hover:shadow-lg transition-shadow border border-gray-200"
            title="Settings"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>

          {/* Layout Toggle */}
          <button
            className="p-3 bg-white rounded-full shadow-lg hover:shadow-lg transition-shadow border border-gray-200"
            title="Customize layout"
          >
            <Layout className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
