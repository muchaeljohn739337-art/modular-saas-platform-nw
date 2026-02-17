// Minimal API Client for Advancia PayLedger
export const apiClient = {
  login: async (credentials) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      data: {
        user: { name: 'Advancia User', email: credentials?.email || 'admin@demo.com', role: 'admin' },
        tokens: { accessToken: 'mock-access-token-' + Date.now(), refreshToken: 'mock-refresh-token-' + Date.now() }
      }
    };
  },
  getWallet: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      data: [
        { currency: 'USD', network: 'Fiat', address: '0x1234567890abcdef1234567890abcdef12345678', balance: 1250.50 },
        { currency: 'USDC', network: 'Ethereum', address: '0xabcdef1234567890abcdef1234567890abcdef12', balance: 500.00 },
        { currency: 'ETH', network: 'Ethereum', address: '0x7890abcdef1234567890abcdef1234567890abcd', balance: 0.75 }
      ]
    };
  }
};
export default apiClient;
