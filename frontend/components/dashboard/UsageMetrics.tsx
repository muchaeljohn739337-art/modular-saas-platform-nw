'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3,
  Users,
  FileText,
  CreditCard,
  Zap
} from 'lucide-react';
import { api } from '../../lib/api';

interface UsageMetric {
  name: string;
  current: number;
  limit: number;
  percentage: number;
  trend: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  icon: any;
  color: string;
  unit: string;
}

interface FeatureUsage {
  feature: string;
  usage: number;
  limit: number;
  percentage: number;
  isPro: boolean;
}

export default function UsageMetrics() {
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchUsageMetrics();
    const interval = setInterval(fetchUsageMetrics, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchUsageMetrics = async () => {
    try {
      const response = await api.get('/api/usage/metrics');
      const data = response.data as any;
      setMetrics(data.metrics);
      setFeatureUsage(data.featureUsage);
    } catch (error) {
      console.error('Failed to fetch usage metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getTrendIcon = (direction: 'up' | 'down') => {
    return direction === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Usage & Limits</h3>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Show Less' : 'Show Details'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Main Usage Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isWarning = metric.percentage >= 80;
            
            return (
              <div key={metric.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 text-${metric.color}-600`} />
                    <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                  </div>
                  {isWarning && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatNumber(metric.current)}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {formatNumber(metric.limit)} {metric.unit}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          metric.percentage >= 90 ? 'bg-red-500' :
                          metric.percentage >= 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getUsageColor(metric.percentage)}`}>
                      {metric.percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend.direction)}
                    <span className="text-xs text-gray-500">
                      {metric.trend.value > 0 ? '+' : ''}{metric.trend.value}% {metric.trend.period}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Usage Breakdown */}
        {showDetails && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Feature Usage</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featureUsage.map((feature) => (
                <div key={feature.feature} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{feature.feature}</span>
                    {feature.isPro && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        PRO
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usage</span>
                      <span className="font-medium">
                        {formatNumber(feature.usage)} / {formatNumber(feature.limit)}
                      </span>
                    </div>
                    
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          feature.percentage >= 90 ? 'bg-red-500' :
                          feature.percentage >= 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(feature.percentage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {feature.percentage.toFixed(1)}% used
                      </span>
                      {feature.percentage >= 80 && (
                        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Upgrade
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Need More Resources?</h4>
              <p className="text-sm opacity-90">
                Upgrade to Pro to increase limits and unlock advanced features
              </p>
            </div>
            <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
