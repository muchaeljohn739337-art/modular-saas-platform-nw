import { Command } from "commander";
import { Monitoring } from "@advancia/sdk";
import { getAuth, getApiUrl } from "../utils/auth";
import { success, error, spinner, printTable, printJson } from "../utils/printer";

const cmd = new Command("monitoring");

cmd
  .description("Monitor system metrics and health")
  .option("-j, --json", "Output in JSON format");

// Get system metrics
cmd
  .command("metrics")
  .description("Get system metrics")
  .option("-s, --service <service>", "Filter by service")
  .option("-t, --type <type>", "Filter by metric type")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching system metrics...");
      loading.start();
      
      try {
        const monitoring = Monitoring(getApiUrl(), token);
        const response = await monitoring.getMetrics({
          service: options.service,
          type: options.type,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Found ${response.data.length} system metrics`);
          
          if (response.data.length > 0) {
            const headers = ["Name", "Service", "Type", "Value", "Unit", "Status", "Updated"];
            const rows = response.data.map((metric: any) => [
              metric.name,
              metric.service,
              metric.type,
              metric.current_value,
              metric.unit,
              metric.status,
              metric.last_updated
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch system metrics: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get health checks
cmd
  .command("health")
  .description("Get system health checks")
  .option("-s, --service <service>", "Filter by service")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching health checks...");
      loading.start();
      
      try {
        const monitoring = Monitoring(getApiUrl(), token);
        const response = await monitoring.getHealthChecks({
          service: options.service
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Health checks for ${response.data.length} services`);
          
          if (response.data.length > 0) {
            const headers = ["Service", "Status", "Response Time", "Uptime", "Error Rate"];
            const rows = response.data.map((check: any) => [
              check.service,
              check.status,
              `${check.response_time}ms`,
              `${check.uptime}%`,
              `${check.error_rate}%`
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch health checks: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Record metric
cmd
  .command("record")
  .description("Record a custom metric")
  .option("-s, --service <service>", "Service name", "custom")
  .option("-n, --name <name>", "Metric name")
  .option("-v, --value <value>", "Metric value")
  .option("-u, --unit <unit>", "Metric unit")
  .option("-t, --type <type>", "Metric type", "custom")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      if (!options.name || !options.value) {
        error("Metric name and value are required");
        process.exit(1);
      }
      
      const loading = spinner("Recording metric...");
      loading.start();
      
      try {
        const monitoring = Monitoring(getApiUrl(), token);
        const response = await monitoring.recordMetric({
          service: options.service,
          name: options.name,
          value: parseFloat(options.value),
          unit: options.unit,
          type: options.type
        });
        
        loading.stop();
        
        success("Metric recorded successfully");
        printJson(response.data, "Metric Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to record metric: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Create alert
cmd
  .command("alert")
  .description("Create a monitoring alert")
  .option("-t, --type <type>", "Alert type")
  .option("-s, --severity <severity>", "Alert severity")
  .option("-m, --message <message>", "Alert message")
  .option("-c, --channel <channel>", "Notification channel")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      if (!options.type || !options.severity || !options.message) {
        error("Alert type, severity, and message are required");
        process.exit(1);
      }
      
      const loading = spinner("Creating alert...");
      loading.start();
      
      try {
        const monitoring = Monitoring(getApiUrl(), token);
        const response = await monitoring.createAlert({
          type: options.type,
          severity: options.severity,
          message: options.message,
          notification_channels: options.channel ? [options.channel] : []
        });
        
        loading.stop();
        
        success("Alert created successfully");
        printJson(response.data, "Alert Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to create alert: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get monitoring stats
cmd
  .command("stats")
  .description("Get monitoring statistics")
  .action(async () => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching monitoring statistics...");
      loading.start();
      
      try {
        const monitoring = Monitoring(getApiUrl(), token);
        const response = await monitoring.getMonitoringStats();
        
        loading.stop();
        
        success("Monitoring Statistics:");
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch monitoring statistics: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
