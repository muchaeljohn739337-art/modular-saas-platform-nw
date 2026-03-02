'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Server,
  Database,
  Wifi,
  Activity
} from 'lucide-react';
import { api } from '../../lib/api';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  services: ServiceStatus[];
  backgroundJobs: {
    active: number;
    failed: number;
    queued: number;
  };
}

export default function SystemStatus() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await api.get('/api/system/health');
      setSystemHealth(response.data as SystemHealth);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(systemHealth?.overall || 'healthy')}`}>
            {getStatusIcon(systemHealth?.overall || 'healthy')}
            <span className="ml-1">
              {systemHealth?.overall === 'healthy' ? 'All Systems Operational' : 
               systemHealth?.overall === 'warning' ? 'Some Issues Detected' : 'Critical Issues'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Services Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Services</h4>
          <div className="space-y-2">
            {systemHealth?.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-500">
                      {service.responseTime}ms response time • {service.uptime}% uptime
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(service.status)}`}>
                  {service.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Jobs */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Background Jobs</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {systemHealth?.backgroundJobs.active || 0}
              </div>
              <div className="text-xs text-blue-600">Active</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {systemHealth?.backgroundJobs.queued || 0}
              </div>
              <div className="text-xs text-green-600">Queued</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {systemHealth?.backgroundJobs.failed || 0}
              </div>
              <div className="text-xs text-red-600">Failed</div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Last updated: {systemHealth?.services[0]?.lastChecked ? 
            new Date(systemHealth.services[0].lastChecked).toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </div>
  );
}
