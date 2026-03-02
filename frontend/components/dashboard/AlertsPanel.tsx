'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CreditCard, 
  Shield, 
  Key,
  TrendingUp,
  Users,
  X,
  Bell,
  Info
} from 'lucide-react';
import { api } from '../../lib/api';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  category: 'billing' | 'security' | 'usage' | 'system';
  title: string;
  message: string;
  action?: {
    text: string;
    url: string;
  };
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/alerts');
      setAlerts((response.data as any).alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await api.put(`/api/alerts/${alertId}/read`);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await api.delete(`/api/alerts/${alertId}`);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getAlertIcon = (category: string) => {
    switch (category) {
      case 'billing':
        return <CreditCard className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'usage':
        return <TrendingUp className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      default:
        return 'border-l-4 border-blue-500';
    }
  };

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 3);
  const unreadCount = alerts.filter(alert => !alert.isRead).length;

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
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View All
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No alerts at this time</p>
            <p className="text-sm text-gray-400">Everything is running smoothly</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertColor(alert.type)} ${getPriorityColor(alert.priority)} ${
                  !alert.isRead ? 'font-semibold' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`mt-0.5 ${getAlertIcon(alert.category)}`}>
                      {getAlertIcon(alert.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.message}
                      </p>
                      
                      {alert.action && (
                        <button
                          onClick={() => window.location.href = alert.action!.url}
                          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {alert.action.text} →
                        </button>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {!alert.isRead && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {alerts.length > 3 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View {alerts.length - 3} more alerts
          </button>
        )}
      </div>
    </div>
  );
}
