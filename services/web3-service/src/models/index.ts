export interface Wallet {
  id: string;
  tenant_id: string;
  user_id: string;
  address: string;
  private_key_encrypted: string;
  blockchain: "ethereum" | "polygon" | "bsc";
  status: "active" | "inactive" | "frozen";
  balance: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  wallet_id: string;
  hash: string;
  from_address: string;
  to_address: string;
  amount: string;
  gas_used: string;
  gas_price: string;
  status: "pending" | "confirmed" | "failed";
  block_number?: number;
  block_hash?: string;
  transaction_index?: number;
  created_at: Date;
  confirmed_at?: Date;
}

export interface SmartContract {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  abi: string;
  blockchain: "ethereum" | "polygon" | "bsc";
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export interface EventLog {
  id: string;
  tenant_id: string;
  contract_address: string;
  event_name: string;
  transaction_hash: string;
  block_number: number;
  log_index: number;
  data: any;
  decoded_data: any;
  created_at: Date;
}

export interface Web3Hook {
  id: string;
  tenant_id: string;
  event_type: string;
  webhook_url: string;
  secret: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
