import { Command } from "commander";
import { Metering } from "@advancia/sdk";
import { getAuth, getApiUrl } from "../utils/auth";
import { success, error, spinner, printTable, printJson } from "../utils/printer";

const cmd = new Command("metering");

cmd
  .description("Manage usage metering and billing")
  .option("-j, --json", "Output in JSON format");

// Record usage
cmd
  .command("record")
  .description("Record usage for billing")
  .option("-t, --type <type>", "Usage type")
  .option("-a, --amount <amount>", "Amount")
  .option("-u, --unit <unit>", "Unit")
  .option("-m, --metadata <metadata>", "Metadata (JSON string)")
  .action(async (options) => {
    try {
      const { token, tenantId } = getAuth();
      
      if (!options.type || !options.amount) {
        error("Usage type and amount are required");
        process.exit(1);
      }
      
      let metadata = {};
      if (options.metadata) {
        try {
          metadata = JSON.parse(options.metadata);
        } catch (e) {
          error("Invalid JSON metadata");
          process.exit(1);
        }
      }
      
      const loading = spinner("Recording usage...");
      loading.start();
      
      try {
        const metering = Metering(getApiUrl(), token, tenantId);
        const response = await metering.record({
          type: options.type,
          amount: parseFloat(options.amount),
          unit: options.unit,
          metadata
        });
        
        loading.stop();
        
        success("Usage recorded successfully");
        printJson(response.data, "Usage Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to record usage: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get usage
cmd
  .command("usage")
  .description("Get usage statistics")
  .option("-t, --type <type>", "Filter by usage type")
  .option("-f, --from <from>", "From date (YYYY-MM-DD)")
  .option("-to, --to>", "To date (YYYY-MM-DD)")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (options) => {
    try {
      const { token, tenantId } = getAuth();
      
      const loading = spinner("Fetching usage statistics...");
      loading.start();
      
      try {
        const metering = Metering(getApiUrl(), token, tenantId);
        const response = await metering.getUsage({
          type: options.type,
          date_from: options.from,
          date_to: options.to,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Usage statistics`);
          
          if (response.data.length > 0) {
            const headers = ["Type", "Amount", "Unit", "Timestamp", "Metadata"];
            const rows = response.data.map((usage: any) => [
              usage.type,
              usage.amount,
              usage.unit,
              usage.timestamp,
              JSON.stringify(usage.metadata)
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch usage statistics: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get billing plans
cmd
  .command("plans")
  .description("Get available billing plans")
  .action(async () => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching billing plans...");
      loading.start();
      
      try {
        const metering = Metering(getApiUrl(), token);
        const response = await metering.getPlans();
        
        loading.stop();
        
        success("Available Billing Plans:");
        
        if (response.data.length > 0) {
          const headers = ["Name", "Price", "Features", "Limits"];
          const rows = response.data.map((plan: any) => [
            plan.name,
            `$${plan.price}`,
            plan.features.join(", "),
            plan.limits.join(", ")
          ]);
          printTable(headers, rows);
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch billing plans: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Subscribe to plan
cmd
  .command("subscribe <planId>")
  .description("Subscribe to a billing plan")
  .option("-e, --email <email>", "Email address")
  .action(async (planId, options) => {
    try {
      const { token, tenantId } = getAuth();
      
      if (!options.email) {
        error("Email address is required");
        process.exit(1);
      }
      
      const loading = spinner("Subscribing to plan...");
      loading.start();
      
      try {
        const metering = Metering(getApiUrl(), token, tenantId);
        const response = await metering.subscribe({
          plan_id: planId,
          email: options.email
        });
        
        loading.stop();
        
        success("Subscription created successfully");
        printJson(response.data, "Subscription Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to subscribe to plan: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get subscription info
cmd
  .command("subscription")
  .description("Get current subscription info")
  .action(async () => {
    try {
      const { token, tenantId } = getAuth();
      
      const loading = spinner("Fetching subscription info...");
      loading.start();
      
      try {
        const metering = Metering(getApiUrl(), token, tenantId);
        const response = await metering.getSubscription();
        
        loading.stop();
        
        success("Current Subscription:");
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch subscription info: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
