// Simple Dashboard Page for Advancia PayLedger
export default function Dashboard() {
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/login';
  };

  const mockWallet = [
    { currency: 'USD', network: 'Fiat', address: '0x1234567890abcdef1234567890abcdef12345678', balance: 1250.50 },
    { currency: 'USDC', network: 'Ethereum', address: '0xabcdef1234567890abcdef1234567890abcdef12', balance: 500.00 },
    { currency: 'ETH', network: 'Ethereum', address: '0x7890abcdef1234567890abcdef1234567890abcd', balance: 0.75 }
  ];

  const totalBalance = mockWallet.reduce((sum, w) => {
    if (w.currency === 'USD' || w.currency === 'USDC') {
      return sum + w.balance;
    }
    return sum;
  }, 0);

  const formatCurrency = (amount, currency = 'USD') => {
    if (currency === 'USD' || currency === 'USDC') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    }
    return amount.toString();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
            Welcome, Advancia User!
          </h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            Total Balance
          </h2>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {formatCurrency(totalBalance)}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            Wallet Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockWallet.map((w, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px'
              }}>
                <div>
                  <p style={{ fontWeight: '500', color: '#1f2937' }}>{w.currency}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{w.network}</p>
                </div>
                <p style={{ fontWeight: 'bold', color: '#1f2937' }}>
                  {formatCurrency(w.balance, w.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              Payment Processing
            </h3>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              Payment processing functionality is available. Send and receive payments securely.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                onClick={() => window.location.href = '/login'}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Send Payment
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Request Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
