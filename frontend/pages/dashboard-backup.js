// Minimal Dashboard Page for Advancia PayLedger
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { apiClient } from "../lib/api.js";

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletData();
    }
  }, [isAuthenticated]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getWallet();
      if (response.success) {
        setWallet(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const totalBalance = wallet ? wallet.reduce((sum, w) => {
    if (w.currency === 'USD' || w.currency === 'USDC') {
      return sum + w.balance;
    }
    return sum;
  }, 0) : 0;

  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h1>Please log in to access your dashboard</h1>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <h1
            style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937" }}
          >
            Welcome, {user?.name}!
          </h1>
          <button
            onClick={logout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            Total Balance
          </h2>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>
            {loading ? "Loading..." : formatCurrency(totalBalance)}
          </p>
        </div>

        {wallet && (
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "16px",
              }}
            >
              Wallet Details
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {wallet.map((w, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: "500", color: "#1f2937" }}>
                      {w.currency}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>
                      {w.network}
                    </p>
                  </div>
                  <p style={{ fontWeight: "bold", color: "#1f2937" }}>
                    {formatCurrency(w.balance, w.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Processing Section */}
        <div style={{ marginTop: "32px" }}>
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "24px",
              }}
            >
              Payment Processing
            </h2>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <p style={{ color: "#6b7280", fontSize: "16px" }}>
                Payment processing functionality is available. Please log in to
                access payment features.
              </p>
              <button
                onClick={() => (window.location.href = "/login")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
