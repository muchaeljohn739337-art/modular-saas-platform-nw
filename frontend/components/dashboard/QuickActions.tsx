'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  Key, 
  Link,
  FileText,
  CreditCard,
  Settings,
  Zap,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { api } from '../../lib/api';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
  isPro?: boolean;
  isLocked?: boolean;
}

export default function QuickActions() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'create-invoice',
      title: 'Create Invoice',
      description: 'Generate new patient invoice',
      icon: FileText,
      color: 'blue',
      action: () => handleCreateInvoice()
    },
    {
      id: 'invite-user',
      title: 'Invite User',
      description: 'Add team member or patient',
      icon: Users,
      color: 'green',
      action: () => handleInviteUser()
    },
    {
      id: 'generate-key',
      title: 'Generate API Key',
      description: 'Create new API access key',
      icon: Key,
      color: 'purple',
      action: () => handleGenerateKey(),
      isPro: true
    },
    {
      id: 'connect-integration',
      title: 'Connect Integration',
      description: 'Link external services',
      icon: Link,
      color: 'orange',
      action: () => handleConnectIntegration()
    },
    {
      id: 'process-payment',
      title: 'Process Payment',
      description: 'Accept patient payment',
      icon: CreditCard,
      color: 'green',
      action: () => handleProcessPayment()
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure platform settings',
      icon: Settings,
      color: 'gray',
      action: () => handleSettings()
    }
  ];

  const handleCreateInvoice = async () => {
    setLoading('create-invoice');
    try {
      // Navigate to invoice creation or open modal
      window.location.href = '/dashboard/invoices?action=create';
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleInviteUser = async () => {
    setLoading('invite-user');
    try {
      // Open invite user modal
      const response = await api.post('/api/users/invite', {
        email: prompt('Enter email address to invite:'),
        role: 'STAFF'
      });
      
      if ((response.data as any).success) {
        alert('Invitation sent successfully!');
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to send invitation');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateKey = async () => {
    setLoading('generate-key');
    try {
      const response = await api.post('/api/api-keys');
      const apiKey = (response.data as { apiKey: string }).apiKey;

      // Show key in modal
      alert(`New API Key: ${apiKey}\n\nSave this key securely. It won't be shown again.`);
    } catch (error) {
      console.error('Failed to generate API key:', error);
      alert('Failed to generate API key');
    } finally {
      setLoading(null);
    }
  };

  const handleConnectIntegration = () => {
    // Open integrations modal
    window.location.href = '/dashboard/integrations';
  };

  const handleProcessPayment = () => {
    // Open payment processing modal
    window.location.href = '/dashboard/payments?action=process';
  };

  const handleSettings = () => {
    window.location.href = '/dashboard/settings';
  };

  const getActionButton = (action: QuickAction) => {
    const Icon = action.icon;
    const isLoading = loading === action.id;
    const isLocked = action.isLocked;

    return (
      <button
        key={action.id}
        onClick={action.action}
        disabled={isLoading || isLocked}
        className={`relative group flex items-center justify-between w-full p-3 rounded-lg border transition-all ${
          isLocked 
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
            : `bg-${action.color}-50 border-${action.color}-200 hover:bg-${action.color}-100 hover:border-${action.color}-300 cursor-pointer`
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${action.color}-100 ${
            isLocked ? 'opacity-50' : ''
          }`}>
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Icon className={`h-4 w-4 text-${action.color}-600`} />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900">
                {action.title}
              </h4>
              {action.isPro && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  PRO
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  LOCKED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{action.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isLocked ? (
            <Key className="h-4 w-4 text-gray-400" />
          ) : (
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Customize
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {quickActions.slice(0, 4).map(action => getActionButton(action))}
        </div>
        
        {/* More Actions Dropdown */}
        <div className="mt-3">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">More Actions</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="mt-2 space-y-2">
              {quickActions.slice(4).map(action => getActionButton(action))}
            </div>
          )}
        </div>
        
        {/* Upgrade CTA */}
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Upgrade to Pro</h4>
              <p className="text-sm opacity-90">Unlock advanced features and integrations</p>
            </div>
            <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
