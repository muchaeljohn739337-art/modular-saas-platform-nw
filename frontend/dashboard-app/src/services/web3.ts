import { apiClient } from "./index";

// Web3 Service Types
export interface CreateWalletRequest {
  tenant_id: string;
  user_id: string;
  wallet_type: "ethereum" | "polygon" | "binance";
  network: "mainnet" | "testnet" | "sepolia";
  address?: string;
}

export interface TransactionRequest {
  tenant_id: string;
  user_id: string;
  to_address: string;
  amount: string;
  gas_limit?: number;
  gas_price?: string;
  data?: string;
  metadata?: Record<string, any>;
}

export interface Transaction {
  id: string;
  hash: string;
  tenant_id: string;
  user_id: string;
  transaction_hash: string;
  from_address: string;
  to_address?: string;
  value: string;
  gas_used: number;
  gas_price: string;
  block_number: number;
  block_hash: string;
  timestamp: string;
  status: "pending" | "confirmed" | "failed" | "reverted";
  type: string;
  metadata: Record<string, any>;
}

export interface Wallet {
  id: string;
  tenant_id: string;
  user_id: string;
  address: string;
  wallet_type: string;
  network: string;
  balance: string;
  nonce: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface SmartContract {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  abi: string;
  bytecode: string;
  network: string;
  deployed_at: string;
  verified: boolean;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface Web3Stats {
  total_transactions: number;
  total_volume: string;
  active_wallets: number;
  deployed_contracts: number;
  gas_price: string;
  network_hashrate: string;
  block_number: number;
  last_block_time: string;
}

// Web3 Service API Methods
export class Web3Service {
  private client = apiClient;

  async createWallet(walletData: CreateWalletRequest): Promise<ApiResponse<Wallet>> {
    return this.client.post<Wallet>("/web3/wallets", walletData);
  }

  async getWallet(walletId: string): Promise<ApiResponse<Wallet>> {
    return this.client.get<Wallet>(`/web3/wallets/${walletId}`);
  }

  async updateWallet(walletId: string, walletData: Partial<Wallet>): Promise<ApiResponse<Wallet>> {
    return this.client.patch<Wallet>(`/web3/wallets/${walletId}`, walletData);
  }

  async deleteWallet(walletId: string): Promise<ApiResponse<null>> {
    return this.client.delete<null>(`/web3/wallets/${walletId}`);
  }

  async listWallets(params?: QueryParams): Promise<ApiResponse<Wallet[]>> {
    return this.client.get<Wallet[]>("/web3/wallets", params);
  }

  async getWalletBalance(walletId: string): Promise<ApiResponse<{ balance: string; address: string }>> {
    return this.client.get<{ balance: string; address: string }>(`/web3/wallets/${walletId}/balance`);
  }

  async sendTransaction(transactionData: TransactionRequest): Promise<ApiResponse<Transaction>> {
    return this.client.post<Transaction>("/web3/transactions", transactionData);
  }

  async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    return this.client.get<Transaction>(`/web3/transactions/${transactionId}`);
  }

  async listTransactions(params?: QueryParams): Promise<ApiResponse<Transaction[]>> {
    return this.client.get<Transaction[]>("/web3/transactions", params);
  }

  async deployContract(contractData: {
    tenant_id: string;
    name: string;
    bytecode: string;
    abi: string;
    network: string;
    owner: string;
  }): Promise<ApiResponse<SmartContract>> {
    return this.client.post<SmartContract>("/web3/contracts", contractData);
  }

  async getContract(contractId: string): Promise<ApiResponse<SmartContract>> {
    return this.client.get<SmartContract>(`/web3/contracts/${contractId}`);
  }

  async listContracts(params?: QueryParams): Promise<ApiResponse<SmartContract[]>> {
    return this.client.get<SmartContract[]>("/web3/contracts", params);
  }

  async getWeb3Stats(): Promise<ApiResponse<Web3Stats>> {
    return this.client.get<Web3Stats>("/web3/stats");
  }

  async estimateGas(transactionData: {
    to_address: string;
    data?: string;
    value: string;
  }): Promise<ApiResponse<{ gas_estimate: number; gas_price: string }>> {
    return this.client.post<{ gas_estimate: number; gas_price: string }>("/web3/estimate-gas", transactionData);
  }
}

export const web3Service = new Web3Service();
