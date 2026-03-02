'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Calendar,
  Clock,
  User,
  Smartphone,
  Building,
  Heart
} from 'lucide-react';
import { api } from '../../lib/api';

interface PaymentMethod {
  id: string;
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'ACH_TRANSFER' | 'HEALTH_SAVINGS_ACCOUNT' | 'FLEXIBLE_SPENDING_ACCOUNT';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountType?: 'CHECKING' | 'SAVINGS';
  isDefault: boolean;
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  patient: {
    user: {
      name: string;
      email: string;
    };
  };
  invoice?: {
    invoiceNumber: string;
    totalAmount: number;
  };
  createdAt: string;
  processedAt?: string;
  transactionId?: string;
}

interface PaymentForm {
  invoiceId: string;
  amount: number;
  method: string;
  paymentDetails: {
    // Card details
    cardNumber?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvv?: string;
    cardholderName?: string;
    
    // ACH details
    accountNumber?: string;
    routingNumber?: string;
    accountType?: 'CHECKING' | 'SAVINGS';
    accountHolderName?: string;
    
    // HSA/FSA details
    hsaCardNumber?: string;
    fsaCardNumber?: string;
  };
}

export default function PaymentProcessing() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    invoiceId: '',
    amount: 0,
    method: 'CREDIT_CARD',
    paymentDetails: {}
  });

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      const [paymentsResponse, methodsResponse] = await Promise.all([
        api.get('/api/payments?limit=50'),
        api.get('/api/payments/methods')
      ]);
      
      setPayments((paymentsResponse.data as any).payments);
      setPaymentMethods((methodsResponse.data as any).paymentMethods);
    } catch (error) {
      console.error('Failed to fetch payment data:', error);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'PROCESSING':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="h-4 w-4" />;
      case 'ACH_TRANSFER':
        return <Building className="h-4 w-4" />;
      case 'HEALTH_SAVINGS_ACCOUNT':
      case 'FLEXIBLE_SPENDING_ACCOUNT':
        return <Heart className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setProcessingPayment(true);
      
      const response = await api.post('/api/payments', paymentForm);
      
      if ((response.data as any).payment.status === 'PROCESSING') {
        // Handle 3D Secure or additional authentication if needed
        console.log('Payment requires additional authentication');
      }
      
      setShowPaymentForm(false);
      setPaymentForm({
        invoiceId: '',
        amount: 0,
        method: 'CREDIT_CARD',
        paymentDetails: {}
      });
      
      await fetchPaymentData(); // Refresh payments list
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    const amount = prompt('Enter refund amount:');
    if (!amount) return;
    
    const reason = prompt('Enter refund reason:');
    if (!reason) return;
    
    try {
      await api.post(`/api/payments/${paymentId}/refund`, {
        amount: parseFloat(amount),
        reason
      });
      
      await fetchPaymentData(); // Refresh payments list
    } catch (error) {
      console.error('Refund failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
          <p className="mt-1 text-sm text-gray-500">
            Process payments and manage payment methods
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowPaymentForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Process Payment
          </button>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handlePaymentSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Process Payment
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Enter payment details to process a new transaction
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Invoice ID
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={paymentForm.invoiceId}
                        onChange={(e) => setPaymentForm({
                          ...paymentForm,
                          invoiceId: e.target.value
                        })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0.01"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            amount: parseFloat(e.target.value)
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Method
                      </label>
                      <select
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm({
                          ...paymentForm,
                          method: e.target.value
                        })}
                      >
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="ACH_TRANSFER">ACH Transfer</option>
                        <option value="HEALTH_SAVINGS_ACCOUNT">HSA</option>
                        <option value="FLEXIBLE_SPENDING_ACCOUNT">FSA</option>
                      </select>
                    </div>

                    {/* Payment method specific fields would go here */}
                    {paymentForm.method === 'CREDIT_CARD' && (
                      <div className="space-y-4 border-t pt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Card Number
                          </label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="4242 4242 4242 4242"
                            value={paymentForm.paymentDetails.cardNumber || ''}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              paymentDetails: {
                                ...paymentForm.paymentDetails,
                                cardNumber: e.target.value
                              }
                            })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Expiry Month
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              max="12"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={paymentForm.paymentDetails.expiryMonth || ''}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm,
                                paymentDetails: {
                                  ...paymentForm.paymentDetails,
                                  expiryMonth: parseInt(e.target.value)
                                }
                              })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Expiry Year
                            </label>
                            <input
                              type="number"
                              required
                              min={new Date().getFullYear()}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={paymentForm.paymentDetails.expiryYear || ''}
                              onChange={(e) => setPaymentForm({
                                ...paymentForm,
                                paymentDetails: {
                                  ...paymentForm.paymentDetails,
                                  expiryYear: parseInt(e.target.value)
                                }
                              })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            CVV
                          </label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={paymentForm.paymentDetails.cvv || ''}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              paymentDetails: {
                                ...paymentForm.paymentDetails,
                                cvv: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {processingPayment ? (
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    ) : null}
                    {processingPayment ? 'Processing...' : 'Process Payment'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Saved Payment Methods
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getMethodIcon(method.type)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {method.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {method.brand || method.bankName} •••• {method.last4}
                    </p>
                  </div>
                </div>
                {method.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
          
          <button className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <div className="text-center">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">
                Add Payment Method
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Payments
            </h3>
            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
              View All
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.slice(0, 10).map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.paymentNumber}
                        </div>
                        {payment.invoice && (
                          <div className="text-sm text-gray-500">
                            Invoice: {payment.invoice.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.patient.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.patient.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getMethodIcon(payment.method)}
                          <span className="ml-2 text-sm text-gray-900">
                            {payment.method.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(payment.status)}
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Download className="h-4 w-4" />
                          </button>
                          {payment.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleRefund(payment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
