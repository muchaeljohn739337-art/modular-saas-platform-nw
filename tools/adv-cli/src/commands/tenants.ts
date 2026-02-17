import { Command } from "commander";
import { Tenant } from "@advancia/sdk";
import { getAuth, getApiUrl } from "../utils/auth";
import { success, error, spinner, printTable } from "../utils/printer";

const cmd = new Command("tenants");

cmd
  .description("Manage tenants")
  .option("-j, --json", "Output in JSON format");

// List tenants
cmd
  .command("list")
  .description("List all tenants")
  .option("-s, --search <search>", "Search tenants")
  .option("-l, --limit <limit>", "Limit results", "10")
  .option("-o, --offset <offset>", "Offset results", "0")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching tenants...");
      loading.start();
      
      try {
        const tenant = Tenant(getApiUrl(), token);
        const response = await tenant.list({
          search: options.search,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset)
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Found ${response.data.length} tenants`);
          
          if (response.data.length > 0) {
            const headers = ["ID", "Name", "Status", "Plan", "Users", "Revenue"];
            const rows = response.data.map((t: any) => [
              t.id,
              t.name,
              t.status,
              t.plan,
              t.user_count,
              `$${t.monthly_revenue}`
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch tenants: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Create tenant
cmd
  .command("create <name>")
  .description("Create a new tenant")
  .option("-p, --plan <plan>", "Plan (starter|professional|enterprise)", "starter")
  .option("-d, --domain <domain>", "Domain")
  .option("-e, --email <email>", "Contact email")
  .action(async (name, options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Creating tenant...");
      loading.start();
      
      try {
        const tenant = Tenant(getApiUrl(), token);
        const response = await tenant.create({
          name,
          plan: options.plan,
          domain: options.domain,
          contact_email: options.email,
          billing_cycle: "monthly"
        });
        
        loading.stop();
        
        success(`Tenant "${name}" created successfully`);
        printJson(response.data, "Tenant Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to create tenant: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get tenant details
cmd
  .command("get <tenantId>")
  .description("Get tenant details")
  .action(async (tenantId) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching tenant details...");
      loading.start();
      
      try {
        const tenant = Tenant(getApiUrl(), token);
        const response = await tenant.get(tenantId);
        
        loading.stop();
        
        success("Tenant Details:");
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch tenant details: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
