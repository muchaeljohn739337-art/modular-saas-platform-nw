import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4004,
  db: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/advancia_web3"
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379"
  },
  blockchain: {
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL || "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
      privateKey: process.env.ETHEREUM_PRIVATE_KEY || "",
      contractAddress: process.env.ETHEREUM_CONTRACT_ADDRESS || ""
    },
    polygon: {
      rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID",
      privateKey: process.env.POLYGON_PRIVATE_KEY || "",
      contractAddress: process.env.POLYGON_CONTRACT_ADDRESS || ""
    }
  },
  serviceName: "web3-service"
};
