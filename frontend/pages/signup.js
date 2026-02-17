// Simple Registration Page for Advancia PayLedger - Alternative
export default function SignupPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', 'mock-access-token-' + Date.now());
      localStorage.setItem('refreshToken', 'mock-refresh-token-' + Date.now());
      window.location.href = '/dashboard';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#3b82f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>$</span>
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            Create Your Account
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Join Advancia PayLedger - Healthcare payment management
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter your first name"
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
                Last Name
              </label>
              <input
                type="text"
                placeholder="Enter your last name"
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
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
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
              Password
            </label>
            <input
              type="password"
              placeholder="Create a strong password"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              required
              style={{ width: '16px', height: '16px' }}
            />
            <label style={{ fontSize: '14px', color: '#6b7280' }}>
              I agree to{' '}
              <a href="/terms" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </label>
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Create Account
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Already have an account?{' '}
            <a 
              href="/login" 
              style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
