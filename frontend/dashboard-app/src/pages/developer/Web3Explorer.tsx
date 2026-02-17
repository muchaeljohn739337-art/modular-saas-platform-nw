import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface Web3Transaction {
  id: string;
  hash: string;
  type: "payment" | "smart_contract" | "token_transfer" | "nft_mint" | "defi";
  status: "pending" | "confirmed" | "failed" | "reverted";
  from_address: string;
  to_address?: string;
  amount?: string;
  gas_used: number;
  gas_price: string;
  block_number?: number;
  block_hash?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

interface BlockchainInfo {
  chain_id: number;
  block_number: number;
  gas_price: string;
  network_hashrate: string;
  difficulty: string;
  total_supply: string;
  last_block_time: Date;
}

export default function Web3Explorer() {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"transactions" | "blocks" | "contracts">("transactions");

  const { data: transactions } = useQuery({
    queryKey: ["web3-transactions", selectedType, selectedStatus, searchTerm],
    queryFn: async () => {
      const response = await api.get("/developer/web3/transactions", {
        params: {
          type: selectedType === "ALL" ? undefined : selectedType,
          status: selectedStatus === "ALL" ? undefined : selectedStatus,
          search: searchTerm || undefined
        }
      });
      return response.data;
    },
    refetchInterval: 10000 // Auto-refresh every 10 seconds
  });

  const { data: blockchainInfo } = useQuery({
    queryKey: ["blockchain-info"],
    queryFn: async () => {
      const response = await api.get("/developer/web3/info");
      return response.data;
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "payment": return "bg-green-100 text-green-800";
      case "smart_contract": return "bg-blue-100 text-blue-800";
      case "token_transfer": return "bg-purple-100 text-purple-800";
      case "nft_mint": return "bg-orange-100 text-orange-800";
      case "defi": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "reverted": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Web3 Explorer</h1>
        <p className="text-gray-600">
          Explore blockchain transactions and smart contracts
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Blockchain Info</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Chain ID:</span>
              <span className="text-gray-600 ml-1">{blockchainInfo?.chain_id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Block:</span>
              <span className="text-gray-600 ml-1">{blockchainInfo?.block_number}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Gas Price:</span>
              <span className="text-gray-600 ml-1">{blockchainInfo?.gas_price} Gwei</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === "transactions" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("blocks")}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === "blocks" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              Blocks
            </button>
            <button
              onClick={() => setActiveTab("contracts")}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === "contracts" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              Contracts
            </button>
          </div>
          
          {activeTab === "transactions" && (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by hash, address..."
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="payment">Payment</option>
                <option value="smart_contract">Smart Contract</option>
                <option value="token_transfer">Token Transfer</option>
                <option value="nft_mint">NFT Mint</option>
                <option value="defi">DeFi</option>
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="reverted">Reverted</option>
              </select>
            </div>
          )}
        </div>
        
        {activeTab === "transactions" && (
          <div className="space-y-2">
            {transactions?.map((tx: Web3Transaction) => (
              <div key={tx.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(tx.type)}`}>
                      {tx.type.replace("_", " ")}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(tx.timestamp), "HH:mm:ss")}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Hash:</span>
                    <span className="text-gray-600 ml-1 font-mono">{formatHash(tx.hash)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">From:</span>
                    <span className="text-gray-600 ml-1 font-mono">{formatAddress(tx.from_address)}</span>
                  </div>
                  {tx.to_address && (
                    <div>
                      <span className="font-medium text-gray-700">To:</span>
                      <span className="text-gray-600 ml-1 font-mono">{formatAddress(tx.to_address)}</span>
                    </div>
                  )}
                  {tx.amount && (
                    <div>
                      <span className="font-medium text-gray-700">Amount:</span>
                      <span className="text-gray-600 ml-1">{tx.amount} ETH</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Gas Used:</span>
                    <span className="text-gray-600 ml-1">{tx.gas_used.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Gas Price:</span>
                    <span className="text-gray-600 ml-1">{tx.gas_price} Gwei</span>
                  </div>
                  {tx.block_number && (
                    <div>
                      <span className="font-medium text-gray-700">Block:</span>
                      <span className="text-gray-600 ml-1">{tx.block_number}</span>
                    </div>
                  )}
                </div>
                
                {Object.keys(tx.metadata).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Metadata</summary>
                    <pre className="text-xs text-gray-600 mt-1">
                      {JSON.stringify(tx.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === "blocks" && (
          <div className="text-center py-8">
            <p className="text-gray-500">Block explorer coming soon...</p>
          </div>
        )}
        
        {activeTab === "contracts" && (
          <div className="text-center py-8">
            <p className="text-gray-500">Smart contract explorer coming soon...</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Tx</span>
              <span className="text-sm font-medium">{transactions?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Confirmed</span>
              <span className="text-sm font-medium text-green-600">
                {transactions?.filter((tx: Web3Transaction) => tx.status === "confirmed").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-medium text-yellow-600">
                {transactions?.filter((tx: Web3Transaction) => tx.status === "pending").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Type Distribution</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Payments</span>
              <span className="text-sm font-medium text-green-600">
                {transactions?.filter((tx: Web3Transaction) => tx.type === "payment").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Smart Contracts</span>
              <span className="text-sm font-medium text-blue-600">
                {transactions?.filter((tx: Web3Transaction) => tx.type === "smart_contract").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Token Transfers</span>
              <span className="text-sm font-medium text-purple-600">
                {transactions?.filter((tx: Web3Transaction) => tx.type === "token_transfer").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Gas Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Gas Used</span>
              <span className="text-sm font-medium">
                {transactions?.reduce((acc: number, tx: Web3Transaction) => acc + tx.gas_used, 0) / (transactions?.length || 1) | 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Gas Price</span>
              <span className="text-sm font-medium">{blockchainInfo?.gas_price} Gwei</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Network Hashrate</span>
              <span className="text-sm font-medium">{blockchainInfo?.network_hashrate}</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-sm">
              Send Transaction
            </button>
            <button className="btn-secondary w-full text-sm">
              Deploy Contract
            </button>
            <button className="btn-secondary w-full text-sm">
              Query Contract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
