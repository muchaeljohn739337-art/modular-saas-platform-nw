import { ethers } from "ethers";
import { config } from "../config/config";
import { Wallet, Transaction, SmartContract } from "../models";

export class Web3Service {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private signers: Map<string, ethers.Wallet> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const ethProvider = new ethers.JsonRpcProvider(config.blockchain.ethereum.rpcUrl);
    this.providers.set("ethereum", ethProvider);

    if (config.blockchain.ethereum.privateKey) {
      const ethSigner = new ethers.Wallet(config.blockchain.ethereum.privateKey, ethProvider);
      this.signers.set("ethereum", ethSigner);
    }

    const polygonProvider = new ethers.JsonRpcProvider(config.blockchain.polygon.rpcUrl);
    this.providers.set("polygon", polygonProvider);

    if (config.blockchain.polygon.privateKey) {
      const polygonSigner = new ethers.Wallet(config.blockchain.polygon.privateKey, polygonProvider);
      this.signers.set("polygon", polygonSigner);
    }
  }

  async createWallet(tenantId: string, userId: string, blockchain: string): Promise<Wallet> {
    const wallet = ethers.Wallet.createRandom();
    const provider = this.providers.get(blockchain);
    
    if (!provider) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }

    const connectedWallet = wallet.connect(provider);
    const address = connectedWallet.address;
    const balance = await provider.getBalance(address);
    const balanceEther = ethers.formatEther(balance);

    const walletData: Wallet = {
      id: `wallet_${Date.now()}`,
      tenant_id: tenantId,
      user_id: userId,
      address,
      private_key_encrypted: wallet.privateKey,
      blockchain: blockchain as any,
      status: "active",
      balance: balanceEther,
      created_at: new Date(),
      updated_at: new Date()
    };

    return walletData;
  }

  async sendTransaction(
    fromWalletId: string,
    toAddress: string,
    amount: string,
    blockchain: string
  ): Promise<Transaction> {
    const provider = this.providers.get(blockchain);
    const signer = this.signers.get(blockchain);
    
    if (!provider || !signer) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }

    const value = ethers.parseEther(amount);
    const gasPrice = await provider.getFeeData();
    
    const tx = await signer.sendTransaction({
      to: toAddress,
      value,
      gasPrice: gasPrice.gasPrice
    });

    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      tenant_id: "temp_tenant",
      wallet_id: fromWalletId,
      hash: tx.hash,
      from_address: signer.address,
      to_address: toAddress,
      amount,
      gas_used: "0",
      gas_price: ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"),
      status: "pending",
      created_at: new Date()
    };

    const receipt = await tx.wait();
    transaction.status = "confirmed";
    transaction.block_number = receipt?.blockNumber;
    transaction.block_hash = receipt?.blockHash;
    transaction.transaction_index = receipt?.index;
    transaction.gas_used = receipt?.gasUsed?.toString();
    transaction.confirmed_at = new Date();

    return transaction;
  }

  async deployContract(
    tenantId: string,
    name: string,
    bytecode: string,
    abi: string,
    blockchain: string
  ): Promise<SmartContract> {
    const signer = this.signers.get(blockchain);
    
    if (!signer) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }

    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy();

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    const contractData: SmartContract = {
      id: `contract_${Date.now()}`,
      tenant_id: tenantId,
      name,
      address: contractAddress,
      abi,
      blockchain: blockchain as any,
      status: "active",
      created_at: new Date(),
      updated_at: new Date()
    };

    return contractData;
  }

  async getTransactionStatus(txHash: string, blockchain: string): Promise<Transaction | null> {
    const provider = this.providers.get(blockchain);
    
    if (!provider) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }

    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return null;
      }

      const tx = await provider.getTransaction(txHash);
      
      const transaction: Transaction = {
        id: `tx_${txHash}`,
        tenant_id: "temp_tenant",
        wallet_id: "temp_wallet",
        hash: txHash,
        from_address: tx?.from || "",
        to_address: tx?.to || "",
        amount: ethers.formatEther(tx?.value || 0),
        gas_used: receipt.gasUsed?.toString() || "0",
        gas_price: ethers.formatUnits(tx?.gasPrice || 0, "gwei"),
        status: receipt.status === 1 ? "confirmed" : "failed",
        block_number: receipt.blockNumber,
        block_hash: receipt.blockHash,
        transaction_index: receipt.index,
        created_at: new Date(),
        confirmed_at: new Date()
      };

      return transaction;
    } catch (error) {
      console.error("Error getting transaction status:", error);
      return null;
    }
  }
}
