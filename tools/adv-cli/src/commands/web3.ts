import { Command } from "commander";
import { Web3 } from "@advancia/sdk";
import { getAuth, getApiUrl } from "../utils/auth";
import { success, error, spinner, printTable, printJson } from "../utils/printer";

const cmd = new Command("web3");

cmd
  .description("Manage Web3 operations")
  .option("-j, --json", "Output in JSON format");

// List Web3 events
cmd
  .command("events")
  .description("List Web3 events")
  .option("-s, --service <service>", "Filter by service")
  .option("-t, --type <type>", "Filter by event type")
  .option("-st, --status <status>", "Filter by status")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching Web3 events...");
      loading.start();
      
      try {
        const web3 = Web3(getApiUrl(), token);
        const response = await web3.events({
          service: options.service,
          type: options.type,
          status: options.status,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Found ${response.data.length} Web3 events`);
          
          if (response.data.length > 0) {
            const headers = ["Hash", "Type", "Service", "Block", "Timestamp"];
            const rows = response.data.map((event: any) => [
              event.hash.substring(0, 10) + "...",
              event.type,
              event.service,
              event.block_number,
              event.timestamp
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch Web3 events: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// List wallets
cmd
  .command("wallets")
  .description("List Web3 wallets")
  .option("-t, --type <type>", "Filter by wallet type")
  .option("-n, --network <network>", "Filter by network")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching Web3 wallets...");
      loading.start();
      
      try {
        const web3 = Web3(getApiUrl(), token);
        const response = await web3.listWallets({
          wallet_type: options.type,
          network: options.network,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Found ${response.data.length} Web3 wallets`);
          
          if (response.data.length > 0) {
            const headers = ["ID", "Address", "Type", "Network", "Balance", "Status"];
            const rows = response.data.map((wallet: any) => [
              wallet.id,
              wallet.address.substring(0, 10) + "...",
              wallet.wallet_type,
              wallet.network,
              `${wallet.balance} ETH`,
              wallet.is_active ? "Active" : "Inactive"
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch Web3 wallets: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Create wallet
cmd
  .command("create-wallet <tenantId>")
  .description("Create a new Web3 wallet")
  .option("-t, --type <type>", "Wallet type", "ethereum")
  .option("-n, --network <network>", "Network", "mainnet")
  .option("-u, --user <user>", "User ID")
  .action(async (tenantId, options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Creating Web3 wallet...");
      loading.start();
      
      try {
        const web3 = Web3(getApiUrl(), token);
        const response = await web3.createWallet({
          tenant_id: tenantId,
          user_id: options.user,
          wallet_type: options.type,
          network: options.network
        });
        
        loading.stop();
        
        success("Web3 wallet created successfully");
        printJson(response.data, "Wallet Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to create Web3 wallet: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get wallet balance
cmd
  .command("balance <walletId>")
  .description("Get wallet balance")
  .action(async (walletId) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching wallet balance...");
      loading.start();
      
      try {
        const web3 = Web3(getApiUrl(), token);
        const response = await web3.getWalletBalance(walletId);
        
        loading.stop();
        
        success("Wallet Balance:");
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch wallet balance: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Send transaction
cmd
  .command("send <walletId>")
  .description("Send Web3 transaction")
  .option("-t, --to <to>", "Recipient address")
  .option("-a, --amount <amount>", "Amount in ETH")
  .option("-g, --gas <gas>", "Gas limit")
  .action(async (walletId, options) => {
    try {
      const { token } = getAuth();
      
      if (!options.to || !options.amount) {
        error("Recipient address and amount are required");
        process.exit(1);
      }
      
      const loading = spinner("Sending transaction...");
      loading.start();
      
      try {
        const web3 = Web3(getApiUrl(), token);
        const response = await web3.sendTransaction({
          wallet_id: walletId,
          to_address: options.to,
          amount: options.amount,
          gas_limit: parseInt(options.gas),
          gas_price: "auto"
        });
        
        loading.stop();
        
        success("Transaction sent successfully");
        printJson(response.data, "Transaction Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to send transaction: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get transaction
cmd
  .command("transaction <txId>")
  .description("Get transaction details")
  .action(async (txId) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching transaction details...");
      loading.start();
      
      try {
        const web3 = Web3(getApiUrl(), token);
        const response = await web3.getTransaction(txId);
        
        loading.stop();
        
        success("Transaction Details:");
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch transaction details: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
