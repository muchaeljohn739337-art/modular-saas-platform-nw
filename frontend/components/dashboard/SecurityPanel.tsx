'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Settings,
  Lock
} from 'lucide-react';
import { api } from '../../lib/api';

interface SecurityInfo {
  twoFactorEnabled: boolean;
  activeSessions: Session[];
  recentLogins: Login[];
  permissions: Permission[];
  lastPasswordChange: string;
  apiKeyExpiry: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

interface Login {
  id: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  browser: string;
  success: boolean;
  suspicious: boolean;
}

interface Permission {
  resource: string;
  actions: string[];
  granted: boolean;
}

export default function SecurityPanel() {
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAllLogins, setShowAllLogins] = useState(false);

  useEffect(() => {
    fetchSecurityInfo();
    const interval = setInterval(fetchSecurityInfo, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityInfo = async () => {
    try {
      const response = await api.get('/api/security/info');
      setSecurityInfo(response.data as SecurityInfo);
    } catch (error) {
      console.error('Failed to fetch security info:', error);
    } finally {
      setLoading(false);
    }
  };

  const enable2FA = async () => {
    try {
      const response = await api.post('/api/security/2fa/enable');
      // Show QR code modal
      alert(`Scan this QR code: ${(response.data as any).qrCode}`);
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/api/security/sessions/${sessionId}`);
      await fetchSecurityInfo();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const regenerateApiKey = async () => {
    if (!confirm('This will invalidate your current API key. Continue?')) return;
    
    try {
      const response = await api.post('/api/security/api-key/regenerate');
      alert(`New API Key: ${(response.data as any).apiKey}\n\nSave this securely.`);
      await fetchSecurityInfo();
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSecurityScore = () => {
    if (!securityInfo) return 0;
    
    let score = 0;
    if (securityInfo.twoFactorEnabled) score += 30;
    if (securityInfo.activeSessions.length <= 3) score += 20;
    if (securityInfo.recentLogins.filter(l => l.suspicious).length === 0) score += 25;
    if (new Date(securityInfo.lastPasswordChange) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) score += 25;
    
    return score;
  };

  const getSecurityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
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

  const securityScore = getSecurityScore();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Security & Account</h3>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Security Settings
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Security Score */}
        <div className={`p-4 rounded-lg border ${getSecurityColor(securityScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Security Score</h4>
              <p className="text-sm opacity-90">
                {securityScore >= 80 ? 'Excellent security posture' :
                 securityScore >= 60 ? 'Good security with room for improvement' :
                 'Security needs attention'}
              </p>
            </div>
            <div className="text-3xl font-bold">{securityScore}%</div>
          </div>
        </div>

        {/* 2FA Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-gray-600" />
            <div>
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">
                {securityInfo?.twoFactorEnabled ? 'Enabled on your account' : 'Add an extra layer of security'}
              </p>
            </div>
          </div>
          {securityInfo?.twoFactorEnabled ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Enabled</span>
            </div>
          ) : (
            <button
              onClick={enable2FA}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Enable 2FA
            </button>
          )}
        </div>

        {/* Active Sessions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Active Sessions</h4>
            <button
              onClick={() => setShowAllSessions(!showAllSessions)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAllSessions ? 'Show Less' : 'Show All'}
            </button>
          </div>
          
          <div className="space-y-2">
            {(showAllSessions ? securityInfo?.activeSessions : securityInfo?.activeSessions.slice(0, 2))?.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.browser} on {session.device}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.location} • Last active {formatDate(session.lastActive)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {session.isCurrent && (
                    <span className="text-xs text-green-600 font-medium">Current</span>
                  )}
                  {!session.isCurrent && (
                    <button
                      onClick={() => revokeSession(session.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logins */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Recent Login Activity</h4>
            <button
              onClick={() => setShowAllLogins(!showAllLogins)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAllLogins ? 'Show Less' : 'Show All'}
            </button>
          </div>
          
          <div className="space-y-2">
            {(showAllLogins ? securityInfo?.recentLogins : securityInfo?.recentLogins.slice(0, 3))?.map((login) => (
              <div key={login.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded ${login.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    {login.success ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {login.success ? 'Successful login' : 'Failed login attempt'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {login.location} • {formatDate(login.timestamp)}
                    </p>
                  </div>
                </div>
                {login.suspicious && (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* API Key Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-gray-600" />
            <div>
              <h4 className="font-medium text-gray-900">API Key</h4>
              <p className="text-sm text-gray-600">
                Expires {securityInfo?.apiKeyExpiry ? formatDate(securityInfo.apiKeyExpiry) : 'Never'}
              </p>
            </div>
          </div>
          <button
            onClick={regenerateApiKey}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            Regenerate
          </button>
        </div>

        {/* Permissions Summary */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Permissions</h4>
          <div className="grid grid-cols-2 gap-3">
            {securityInfo?.permissions.slice(0, 4).map((permission) => (
              <div key={permission.resource} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{permission.resource}</p>
                  <p className="text-xs text-gray-500">{permission.actions.join(', ')}</p>
                </div>
                {permission.granted ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
