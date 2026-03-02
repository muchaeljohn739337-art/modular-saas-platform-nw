'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Brain, 
  Lightbulb,
  AlertTriangle,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { api } from '../../lib/api';

interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  period: string;
  direction: 'up' | 'down';
}

interface Anomaly {
  id: string;
  metric: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
  suggestion: string;
}

interface Forecast {
  metric: string;
  currentValue: number;
  forecastValue: number;
  confidence: number;
  period: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement';
  title: string;
  description: string;
  impact: string;
  action?: {
    text: string;
    url: string;
  };
  timestamp: string;
}

export default function DataIntelligence() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchIntelligenceData();
    const interval = setInterval(fetchIntelligenceData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchIntelligenceData = async () => {
    try {
      const response = await api.get('/api/intelligence/dashboard');
      const data = response.data as any;
      setTrends(data.trends);
      setAnomalies(data.anomalies);
      setForecasts(data.forecasts);
      setInsights(data.insights);
    } catch (error) {
      console.error('Failed to fetch intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    return direction === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : direction === 'down' ? (
      <TrendingDown className="h-4 w-4 text-red-500" />
    ) : (
      <Minus className="h-4 w-4 text-gray-500" />
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'achievement':
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
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
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Data Intelligence</h3>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Show Less' : 'Show Details'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Trends */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Key Trends</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trends.map((trend) => (
              <div key={trend.metric} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{trend.metric}</span>
                  {getTrendIcon(trend.direction)}
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(trend.current)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trend.direction === 'up' ? '+' : ''}{trend.changePercent.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">vs {trend.period}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">AI Insights</h4>
          <div className="space-y-3">
            {insights.slice(0, showDetails ? insights.length : 2).map((insight) => (
              <div key={insight.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">{insight.title}</h5>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        insight.type === 'opportunity' ? 'bg-green-100 text-green-800' :
                        insight.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {insight.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Impact: {insight.impact}</p>
                    
                    {insight.action && (
                      <button
                        onClick={() => window.location.href = insight.action!.url}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {insight.action.text} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomalies Detection */}
        {showDetails && anomalies.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Anomaly Detection</h4>
            <div className="space-y-3">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className={`p-4 border rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium">{anomaly.metric}</h5>
                      <p className="text-sm mt-1">{anomaly.description}</p>
                      <p className="text-xs mt-2 opacity-75">
                        Detected: {new Date(anomaly.detectedAt).toLocaleString()}
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="mt-3 p-3 bg-white bg-opacity-50 rounded">
                    <p className="text-sm font-medium">Suggestion:</p>
                    <p className="text-sm">{anomaly.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forecasts */}
        {showDetails && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Forecast Projections</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forecasts.map((forecast) => (
                <div key={forecast.metric} className="p-4 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-900">{forecast.metric}</h5>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium">{formatNumber(forecast.currentValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Forecast ({forecast.period}):</span>
                      <span className="font-medium">{formatNumber(forecast.forecastValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-medium">{forecast.confidence}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(forecast.trend === 'increasing' ? 'up' : forecast.trend === 'decreasing' ? 'down' : 'stable')}
                      <span className="text-xs text-gray-500 capitalize">{forecast.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Performance Summary</h4>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered insights based on your data patterns and trends
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                {insights.length} insights available
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
