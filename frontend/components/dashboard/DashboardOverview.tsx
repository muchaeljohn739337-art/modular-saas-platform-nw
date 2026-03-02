'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileText, 
  Users, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  totalPatients: number;
  totalPayments: number;
  revenueChange: number;
  invoiceChange: number;
  patientChange: number;
  paymentChange: number;
}

interface RecentActivity {
  id: string;
  type: 'invoice' | 'payment' | 'patient';
  description: string;
  amount?: number;
  timestamp: string;
  status?: string;
}

interface UpcomingInvoice {
  id: string;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalInvoices: 0,
    totalPatients: 0,
    totalPayments: 0,
    revenueChange: 0,
    invoiceChange: 0,
    patientChange: 0,
    paymentChange: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState<UpcomingInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await api.get('/api/billing/reports/summary');
      setStats(statsResponse.data as DashboardStats);

      // Fetch recent activity
      const activityResponse = await api.get('/api/billing/invoices?limit=5');
      const paymentsResponse = await api.get('/api/payments?limit=5');
      
      const activities: RecentActivity[] = [
        ...(activityResponse.data as any).invoices.map((invoice: any) => ({
          id: invoice.id,
          type: 'invoice' as const,
          description: `Invoice ${invoice.invoiceNumber} created`,
          amount: invoice.totalAmount,
          timestamp: invoice.createdAt,
          status: invoice.status
        })),
        ...(paymentsResponse.data as any).payments.map((payment: any) => ({
          id: payment.id,
          type: 'payment' as const,
          description: `Payment ${payment.paymentNumber} received`,
          amount: payment.amount,
          timestamp: payment.createdAt,
          status: payment.status
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 10);

      setRecentActivity(activities);

      // Fetch upcoming invoices
      const upcomingResponse = await api.get('/api/billing/reports/unpaid?limit=5');
      setUpcomingInvoices((upcomingResponse.data as any).invoices.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientName: invoice.patient.user.name,
        amount: invoice.balance,
        dueDate: invoice.dueDate,
        daysUntilDue: Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      })));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue' 
  }: { 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: any; 
    color?: string;
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-500`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {typeof value === 'number' ? formatCurrency(value) : value}
                </div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? (
                      <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                    )}
                    <span className="sr-only">
                      {change >= 0 ? 'Increased' : 'Decreased'} by
                    </span>
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          change={stats.revenueChange}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          change={stats.invoiceChange}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          change={stats.patientChange}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Total Payments"
          value={stats.totalPayments}
          change={stats.paymentChange}
          icon={CreditCard}
          color="yellow"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <div className="mt-5">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {activity.type === 'invoice' ? (
                              <FileText className="h-6 w-6 text-blue-500" />
                            ) : activity.type === 'payment' ? (
                              <CreditCard className="h-6 w-6 text-green-500" />
                            ) : (
                              <Users className="h-6 w-6 text-purple-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.description}
                            </p>
                            <div className="flex items-center mt-1">
                              <Clock className="h-4 w-4 text-gray-400 mr-1" />
                              <p className="text-sm text-gray-500">
                                {formatDate(activity.timestamp)}
                              </p>
                              {activity.amount && (
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                  {formatCurrency(activity.amount)}
                                </span>
                              )}
                              {activity.status && (
                                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  activity.status === 'COMPLETED' || activity.status === 'PAID'
                                    ? 'bg-green-100 text-green-800'
                                    : activity.status === 'PENDING' || activity.status === 'SENT'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {activity.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Invoices */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upcoming Invoices
              </h3>
              <div className="mt-5">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {upcomingInvoices.map((invoice) => (
                      <li key={invoice.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {invoice.patientName}
                            </p>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                              <p className="text-sm text-gray-500">
                                {formatDate(invoice.dueDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.amount)}
                            </p>
                            <p className={`text-xs ${
                              invoice.daysUntilDue <= 3 
                                ? 'text-red-600' 
                                : invoice.daysUntilDue <= 7 
                                ? 'text-yellow-600' 
                                : 'text-gray-500'
                            }`}>
                              {invoice.daysUntilDue <= 0 ? 'Overdue' : `${invoice.daysUntilDue} days`}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payment
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Users className="mr-2 h-4 w-4" />
              Add Patient
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <AlertCircle className="mr-2 h-4 w-4" />
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
