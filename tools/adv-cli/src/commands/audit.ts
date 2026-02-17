import { Command } from "commander";
import { Audit } from "@advancia/sdk";
import { getAuth, getApiUrl } from "../utils/auth";
import { success, error, spinner, printTable, printJson } from "../utils/printer";

const cmd = new Command("audit");

cmd
  .description("Manage audit logs and compliance")
  .option("-j, --json", "Output in JSON format");

// Query audit logs
cmd
  .command("logs")
  .description("Query audit logs")
  .option("-t, --tenant <tenant>", "Tenant ID")
  .option("-u, --user <user>", "User ID")
  .option("-a, --action <action>", "Filter by action")
  .option("-r, --resource <resource>", "Filter by resource")
  .option("-s, --severity <severity>", "Filter by severity")
  .option("-f, --from <from>", "From date (YYYY-MM-DD)")
  .option("-to, --to>", "To date (YYYY-MM-DD)")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching audit logs...");
      loading.start();
      
      try {
        const audit = Audit(getApiUrl(), token);
        const response = await audit.logs({
          tenant_id: options.tenant,
          user_id: options.user,
          action: options.action,
          resource: options.resource,
          severity: options.severity,
          date_from: options.from,
          date_to: options.to,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Found ${response.data.length} audit logs`);
          
          if (response.data.length > 0) {
            const headers = ["Timestamp", "Action", "Resource", "User", "Severity", "IP"];
            const rows = response.data.map((log: any) => [
              log.timestamp,
              log.action,
              log.resource,
              log.user_id,
              log.severity,
              log.ip_address
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch audit logs: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get audit statistics
cmd
  .command("stats")
  .description("Get audit statistics")
  .option("-t, --tenant <tenant>", "Tenant ID")
  .option("-f, --from <from>", "From date (YYYY-MM-DD)")
  .option("-to, --to>", "To date (YYYY-MM-DD)")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching audit statistics...");
      loading.start();
      
      try {
        const audit = Audit(getApiUrl(), token);
        const response = await audit.getStats({
          tenant_id: options.tenant,
          date_from: options.from,
          date_to: options.to
        });
        
        loading.stop();
        
        success("Audit Statistics:");
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch audit statistics: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Export audit logs
cmd
  .command("export")
  .description("Export audit logs")
  .option("-t, --tenant <tenant>", "Tenant ID")
  .option("-f, --format <format>", "Export format (json|csv|xml)", "json")
  .option("-o, --output <output>", "Output file")
  .option("-s, --search <search>", "Search term")
  .option("-l, --limit <limit>", "Limit results", "1000")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Exporting audit logs...");
      loading.start();
      
      try {
        const audit = Audit(getApiUrl(), token);
        const response = await audit.exportLogs({
          tenant_id: options.tenant,
          format: options.format,
          search: options.search,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        success(`Audit logs exported successfully`);
        
        if (response.data.download_url) {
          console.log(`Download URL: ${response.data.download_url}`);
        }
        
        if (options.output) {
          console.log(`Saved to: ${options.output}`);
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to export audit logs: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Search audit logs
cmd
  .command("search <query>")
  .description("Search audit logs")
  .option("-t, --tenant <tenant>", "Tenant ID")
  .option("-f, --from <from>", "From date (YYYY-MM-DD)")
  .option("-to, --to>", "To date (YYYY-MM-DD)")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (query, options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Searching audit logs...");
      loading.start();
      
      try {
        const audit = Audit(getApiUrl(), token);
        const response = await audit.searchLogs({
          query,
          tenant_id: options.tenant,
          date_from: options.from,
          date_to: options.to,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        success(`Found ${response.data.length} matching audit logs`);
        
        if (response.data.length > 0) {
          const headers = ["Timestamp", "Action", "Resource", "User", "Severity", "IP"];
          const rows = response.data.map((log: any) => [
            log.timestamp,
            log.action,
            log.resource,
            log.user_id,
            log.severity,
            log.ip_address
          ]);
          printTable(headers, rows);
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to search audit logs: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get audit trail
cmd
  .command("trail")
  .description("Get audit trail for resource")
  .option("-r, --resource <resource>", "Resource ID")
  .option("-t, --tenant <tenant>", "Tenant ID")
  .option("-u, --user <user>", "User ID")
  .option("-f, --from <from>", "From date (YYYY-MM-DD)")
  .option("-to, --to>", "To date (YYYY-MM-DD)")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      if (!options.resource) {
        error("Resource ID is required for audit trail");
        process.exit(1);
      }
      
      const loading = spinner("Fetching audit trail...");
      loading.start();
      
      try {
        const audit = Audit(getApiUrl(), token);
        const response = await audit.getTrail({
          resource: options.resource,
          tenant_id: options.tenant,
          user_id: options.user,
          date_from: options.from,
          date_to: options.to,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        success(`Audit trail for resource "${options.resource}"`);
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch audit trail: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
