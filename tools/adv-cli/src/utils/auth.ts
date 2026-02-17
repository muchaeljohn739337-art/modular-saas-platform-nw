import { loadConfig, Config } from "./config";

export const getAuth = (): { token: string; tenantId?: string } => {
  const config = loadConfig();
  
  if (!config.token) {
    throw new Error("No authentication token found. Please run \"adv login\" first.");
  }
  
  return {
    token: config.token,
    tenantId: config.tenantId
  };
};

export const getTenantId = (): string => {
  const config = loadConfig();
  
  if (!config.tenantId) {
    throw new Error("No tenant ID found. Please set a tenant first.");
  }
  
  return config.tenantId;
};

export const getApiUrl = (): string => {
  const config = loadConfig();
  return config.apiUrl || "http://localhost:4000";
};

export const isAuthenticated = (): boolean => {
  const config = loadConfig();
  return !!config.token;
};

export const setAuth = (token: string, tenantId?: string): void => {
  const config = loadConfig();
  config.token = token;
  if (tenantId) {
    config.tenantId = tenantId;
  }
  config.lastLogin = new Date().toISOString();
  
  const { saveConfig } = require("./config");
  saveConfig(config);
};

export const clearAuth = (): void => {
  const config = loadConfig();
  delete config.token;
  delete config.tenantId;
  delete config.lastLogin;
  
  const { saveConfig } = require("./config");
  saveConfig(config);
};
