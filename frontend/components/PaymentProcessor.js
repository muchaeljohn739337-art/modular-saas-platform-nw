// Payment Processor Component for Advancia PayLedger
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api.js';

export default function PaymentProcessor() {
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Send payment form state
  const [sendPaymentData, setSendPaymentData] = useState({
    recipientEmail: '',
    amount: '',
    currency: 'USD',
    description: '',
    paymentMethod: 'wallet'
  });

  // Request payment form state
  const [requestPaymentData, setRequestPaymentData] = useState({
    requesterEmail: '',
    amount: '',
    currency: 'USD',
    description: '',
    dueDate: ''
  });

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'USDC', name: 'USD Coin', symbol: '$' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' }
  ];

  const paymentMethods = [
    { id: 'wallet', name: 'Wallet Balance', icon: '💳' },
    { id: 'ach', name: 'ACH Transfer', icon: '🏦' },
    { id: 'wire', name: 'Wire Transfer', icon: '📡' },
    { id: 'card', name: 'Debit/Credit Card', icon: '💳' }
  ];

  const handleSendPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.sendPayment({
        recipientEmail: sendPaymentData.recipientEmail,
        amount: parseFloat(sendPaymentData.amount),
        currency: sendPaymentData.currency,
        description: sendPaymentData.description,
        paymentMethod: sendPaymentData.paymentMethod
      });

      if (response.success) {
        setSuccess(`Payment of ${sendPaymentData.currency} ${sendPaymentData.amount} sent successfully!`);
        setSendPaymentData({
          recipientEmail: '',
          amount: '',
          currency: 'USD',
          description: '',
          paymentMethod: 'wallet'
        });
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error) {
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.requestPayment({
        requesterEmail: requestPaymentData.requesterEmail,
        amount: parseFloat(requestPaymentData.amount),
        currency: requestPaymentData.currency,
        description: requestPaymentData.description,
        dueDate: requestPaymentData.dueDate
      });

      if (response.success) {
        setSuccess(`Payment request of ${requestPaymentData.currency} ${requestPaymentData.amount} sent successfully!`);
        setRequestPaymentData({
          requesterEmail: '',
          amount: '',
          currency: 'USD',
          description: '',
          dueDate: ''
        });
      } else {
        throw new Error(response.message || 'Payment request failed');
      }
    } catch (error) {
      setError(error.message || 'Payment request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const currencyInfo = currencies.find(c => c.code === currency);
    const symbol = currencyInfo ? currencyInfo.symbol : '$';
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '24px', 
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>
        Payment Processing
      </h2>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('send')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'send' ? '#3b82f6' : 'transparent',
            color: activeTab === 'send' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'send' ? '2px solid #3b82f6' : '2px solid transparent'
          }}
        >
          Send Payment
        </button>
        <button
          onClick={() => setActiveTab('request')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'request' ? '#3b82f6' : 'transparent',
            color: activeTab === 'request' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'request' ? '2px solid #3b82f6' : '2px solid transparent'
          }}
        >
          Request Payment
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '6px',
          color: '#166534',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#dc2626',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Send Payment Form */}
      {activeTab === 'send' && (
        <form onSubmit={handleSendPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Recipient Email
            </label>
            <input
              type="email"
              value={sendPaymentData.recipientEmail}
              onChange={(e) => setSendPaymentData({...sendPaymentData, recipientEmail: e.target.value})}
              placeholder="recipient@example.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={sendPaymentData.amount}
                onChange={(e) => setSendPaymentData({...sendPaymentData, amount: e.target.value})}
                placeholder="0.00"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Currency
              </label>
              <select
                value={sendPaymentData.currency}
                onChange={(e) => setSendPaymentData({...sendPaymentData, currency: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Payment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {paymentMethods.map(method => (
                <label
                  key={method.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    border: sendPaymentData.paymentMethod === method.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={sendPaymentData.paymentMethod === method.id}
                    onChange={(e) => setSendPaymentData({...sendPaymentData, paymentMethod: e.target.value})}
                    style={{ marginRight: '8px' }}
                  />
                  <span>{method.icon} {method.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Description (optional)
            </label>
            <textarea
              value={sendPaymentData.description}
              onChange={(e) => setSendPaymentData({...sendPaymentData, description: e.target.value})}
              placeholder="What's this payment for?"
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Processing...' : `Send Payment ${sendPaymentData.amount ? formatCurrency(sendPaymentData.amount, sendPaymentData.currency) : ''}`}
          </button>
        </form>
      )}

      {/* Request Payment Form */}
      {activeTab === 'request' && (
        <form onSubmit={handleRequestPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Requester Email
            </label>
            <input
              type="email"
              value={requestPaymentData.requesterEmail}
              onChange={(e) => setRequestPaymentData({...requestPaymentData, requesterEmail: e.target.value})}
              placeholder="requester@example.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={requestPaymentData.amount}
                onChange={(e) => setRequestPaymentData({...requestPaymentData, amount: e.target.value})}
                placeholder="0.00"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Currency
              </label>
              <select
                value={requestPaymentData.currency}
                onChange={(e) => setRequestPaymentData({...requestPaymentData, currency: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Due Date (optional)
            </label>
            <input
              type="date"
              value={requestPaymentData.dueDate}
              onChange={(e) => setRequestPaymentData({...requestPaymentData, dueDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              value={requestPaymentData.description}
              onChange={(e) => setRequestPaymentData({...requestPaymentData, description: e.target.value})}
              placeholder="What's this payment request for?"
              rows={3}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Processing...' : `Request Payment ${requestPaymentData.amount ? formatCurrency(requestPaymentData.amount, requestPaymentData.currency) : ''}`}
          </button>
        </form>
      )}
    </div>
  );
}
