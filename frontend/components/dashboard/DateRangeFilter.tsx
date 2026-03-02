'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Download, Filter } from 'lucide-react';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  loading?: boolean;
}

interface PresetRange {
  label: string;
  value: string;
  days: number;
}

export default function DateRangeFilter({ onDateRangeChange, onExport, loading = false }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const presetRanges: PresetRange[] = [
    { label: 'Last 7 days', value: '7d', days: 7 },
    { label: 'Last 30 days', value: '30d', days: 30 },
    { label: 'Last 90 days', value: '90d', days: 90 },
    { label: 'Last 6 months', value: '6m', days: 180 },
    { label: 'Last year', value: '1y', days: 365 },
    { label: 'Custom range', value: 'custom', days: 0 }
  ];

  useEffect(() => {
    applyDateRange(selectedPreset);
  }, [selectedPreset]);

  const applyDateRange = (preset: string) => {
    if (preset === 'custom') {
      setShowCustom(true);
      return;
    }

    const range = presetRanges.find(r => r.value === preset);
    if (!range || range.days === 0) return;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - range.days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    onDateRangeChange(startDateStr, endDateStr);
    setShowCustom(false);
  };

  const applyCustomRange = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange(customStartDate, customEndDate);
      setShowCustom(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    onExport(format);
    setShowExportMenu(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Date Range Selection */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {presetRanges.find(r => r.value === selectedPreset)?.label || 'Select range'}
              <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
            </button>
            
            {showCustom && (
              <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="p-2">
                  {presetRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => {
                        setSelectedPreset(range.value);
                        setShowCustom(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 ${
                        selectedPreset === range.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Date Range */}
        {showCustom && (
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End date"
            />
            <button
              onClick={applyCustomRange}
              disabled={!customStartDate || !customEndDate}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        )}

        {/* Export Options */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 z-10 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>
    </div>
  );
}
