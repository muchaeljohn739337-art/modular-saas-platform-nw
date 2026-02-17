import { cli } from "./cli";

// Create the main CLI file
const cli = {
  login: async (email: string, password: string) => {
    const client = cli();
    return await client.login({ email, password });
  },

  logout: async () => {
    const client = cli();
    return await client.logout();
  },

  whoami: async () => {
    const client = cli();
    return await client.whoami();
  },

  tenants: async (params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  }) => {
    const client = cli();
    return await client.tenants(params);
  },

  billing: async (tenantId: string) => {
    const client = cli();
    return await client.billing.getTenantStats(tenantId);
  },

  ai: async (agentId: string, params?: any) => {
    const client = cli();
    return await client.ai.run(agentId, params);
  },

  web3: async (params?: {
    service?: string;
    limit?: number;
    type?: string;
    status?: string;
  }) => {
    const client = cli();
    return await client.web3.events(params);
  },

  monitoring: async (service?: string) => {
    const client = cli();
    return await client.monitoring.metrics({ service });
  },

  security: async () => {
    const client = cli();
    return await client.security.health();
  },

  audit: async (params?: {
    tenant_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    limit?: number;
  }) => {
    const client = cli();
    return await client.audit.logs(params);
  }
};

// Export the main CLI
export default cli;
