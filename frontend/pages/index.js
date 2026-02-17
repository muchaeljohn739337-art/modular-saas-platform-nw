// Simple Homepage for Advancia PayLedger
export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1e293b', 
      color: 'white',
      padding: '80px 20px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '32px'
        }}>
          $
        </div>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          lineHeight: '1.2'
        }}>
          The Future of Healthcare Payments
        </h1>
        <p style={{ 
          fontSize: '20px', 
          marginBottom: '32px',
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto 32px'
        }}>
          Streamline your healthcare payment processing with secure, instant, and compliant transactions designed for modern medical practice.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.href = '/register'}
            style={{
              padding: '16px 32px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Start Free Trial
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
