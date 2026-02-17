#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { cli } from "./cli";

// CLI Program
const program = new Command();

program
  .name("adv")
  .description("Advancia PayLedger CLI Tool")
  .version("1.0.0");

// Login command
program
  .command("login")
  .description("Login to Advancia PayLedger")
  .argument("<email>", "User email")
  .option("-p, --password <password>", "User password")
  .action(async (email, options) => {
    console.log(chalk.blue("🔐 Logging in to Advancia PayLedger..."));
    
    try {
      let password = options.password;
      
      if (!password) {
        const answers = await inquirer.prompt([
          {
            type: "password",
            name: "password",
            message: "Enter your password:",
            mask: "*"
          }
        ]);
        password = answers.password;
      }
      
      const result = await cli.login(email, password);
      console.log(chalk.green("✅ Login successful!"));
      console.log(chalk.blue("🔐 Access token saved to environment"));
      
    } catch (error) {
      console.error(chalk.red("❌ Login failed:"), error.message);
      process.exit(1);
    }
  });

// Logout command
program
  .command("logout")
  .description("Logout from Advancia PayLedger")
  .action(async () => {
    console.log(chalk.blue("🔐 Logging out..."));
    
    try {
      await cli.logout();
      console.log(chalk.green("✅ Logout successful!"));
      console.log(chalk.blue("🔐 Token removed from environment"));
      
    } catch (error) {
      console.error(chalk.red("❌ Logout failed:"), error.message);
      process.exit(1);
    }
  });

// Whoami command
program
  .command("whoami")
  .description("Get current user information")
  .action(async () => {
    console.log(chalk.blue("👤 Getting user information..."));
    
    try {
      const user = await cli.whoami();
      console.log(chalk.green("✅ Current User:"));
      console.log(chalk.white(`  Name: ${user.name}`));
      console.log(chalk.white(`  Email: ${user.email}`));
      console.log(chalk.white(`  Role: ${user.role}`));
      console.log(chalk.white(`  Tenant: ${user.tenant_id}`));
      console.log(chalk.white(`  Status: ${user.status}`));
      console.log(chalk.white(`  Subscription: ${user.subscription_status}`));
      
    } catch (error) {
      console.error(chalk.red("❌ Failed to get user info:"), error.message);
      process.exit(1);
    }
  });

// Tenants command
program
  .command("tenants")
  .description("List all tenants")
  .option("-s, --search <search>", "Search tenants")
  .option("-l, --limit <limit>", "Limit results", "10")
  .option("-o, --offset <offset>", "Offset results", "0")
  .option("-t, --status <status>", "Filter by status")
  .action(async (options) => {
    console.log(chalk.blue("📊 Getting tenants..."));
    
    try {
      const tenants = await cli.tenants({
        search: options.search,
        limit: parseInt(options.limit),
        offset: parseInt(options.offset),
        status: options.status
      });
      
      console.log(chalk.green(`📊 Found ${tenants.length} tenants:`));
      
      tenants.forEach((tenant, index) => {
        console.log(chalk.white(`  ${index + 1}. ${tenant.name} (${tenant.id})`));
        console.log(chalk.gray(`     Status: ${tenant.status}`));
        console.log(chalk.gray(`     Users: ${tenant.user_count}`));
        console.log(chalk.gray(`     Revenue: $${tenant.monthly_revenue}`));
        console.log(chalk.gray(`     Plan: ${tenant.plan}`));
        console.log(chalk.gray(`     Created: ${tenant.created_at}`));
      });
      
    } catch (error) {
      console.error(chalk.red("❌ Failed to get tenants:"), error.message);
      process.exit(1);
    }
  });

// Billing command
program
  .command("billing")
  .description("Get billing information")
  .argument("<tenant-id>", "Tenant ID")
  .action(async (tenantId) => {
    console.log(chalk.blue("📊 Getting billing information..."));
    
    try {
      const billing = await cli.billing(tenantId);
      console.log(chalk.green(`📊 Billing Stats for Tenant: ${tenantId}`));
      console.log(chalk.white(`  Revenue: ${billing.total_revenue}`));
      console.log(chalk.white(`  Monthly Revenue: ${billing.monthly_revenue}`));
      console.log(chalk.white(`  Active Subscriptions: ${billing.active_subscriptions}`));
      console.log(chalk.white(`  Total Invoices: ${billing.total_invoices}`));
      console.log(chalk.white(`  Overdue Invoices: ${billing.overdue_invoices}`));
      console.log(chalk.white(`  Success Rate: ${billing.success_rate}%`));
      
    } catch (error) {
      console.error(chalk.red("❌ Failed to get billing stats:"), error.message);
      process.exit(1);
    }
  });

// AI command
program
  .command("ai")
  .description("AI operations")
  .addCommand(
    new Command("list").description("List AI agents")
  )
  .addCommand(
    new Command("run").description("Run AI agent")
      .argument("<agent-id>", "Agent ID")
      .option("-t, --tenant-id <tenant-id>", "Tenant ID")
      .option("-u, --user-id <user-id>", "User ID")
      .option("-p, --priority <priority>", "Priority (low, medium, high, critical)")
  )
  )
  .action(async (command, args) => {
    if (command === "list") {
      console.log(chalk.blue("🤖 Getting AI agents..."));
      
      try {
        const agents = await cli.ai.list();
        console.log(chalk.green(`🤖 Found ${agents.length} AI agents:`));
        
        agents.forEach((agent, index) => {
          console.log(chalk.white(`  ${index + 1}. ${agent.name} (${agent.id})`));
          console.log(chalk.gray(`     Type: ${agent.agent_type}`));
          console.log(chalk.gray(`     Status: ${agent.enabled ? "Enabled" : "Disabled"}`));
          console.log(chalk.gray(`     Success Rate: ${agent.success_rate}%`));
          console.log(chalk.gray(`     Avg Execution Time: ${agent.avg_execution_time}s`));
        });
        
      } catch (error) {
        console.error(chalk.red("❌ Failed to get AI agents:"), error.message);
        process.exit(1);
    }
    
    if (command === "run") {
      console.log(chalk.blue("🤖 Running AI agent..."));
      
      try {
        const result = await cli.ai.run(args.agentId, {
          tenant_id: args.tenantId,
          user_id: args.userId,
          priority: args.priority
        });
        
        console.log(chalk.green(`🤖 AI Agent ${args.agentId} started:`));
        console.log(chalk.white(`  Task ID: ${result.id}`));
        console.log(chalk.white(`  Status: ${result.status}`));
        console.log(chalk.white(`  Progress: ${result.progress}%`));
        
      } catch (error) {
        console.error(chalk.red("❌ Failed to run AI agent:"), error.message);
        process.exit(1);
    }
  });

// Web3 command
program
  .command("web3")
  .description("Web3 operations")
  .addCommand(
    new Command("events").description("Get Web3 events")
      .option("-s, --service <service>", "Filter by service")
      .option("-l, --limit <limit>", "Limit results", "10")
      .option("-t, --type <type>", "Filter by type")
      .option("-st, --status <status>", "Filter by status")
  )
  .action(async (command, options) => {
    if (command === "events") {
      console.log(chalk.blue("🔗 Getting Web3 events..."));
      
      try {
        const events = await cli.web3.events({
          service: options.service,
          limit: parseInt(options.limit),
          type: options.type,
          status: options.status
        });
        
        console.log(chalk.green(`🔗 Found ${events.length} Web3 events:`));
        
        events.forEach((event, index) => {
          console.log(chalk.white(`  ${index + 1}. ${event.type}: ${event.hash}`));
          console.log(chalk.gray(`     Service: ${event.service}`));
          console.log(chalk.gray(`     Block: ${event.block_number}`));
          console.log(chalk.gray(`     Timestamp: ${event.timestamp}`));
          console.log(chalk.gray(`     Data: ${JSON.stringify(event.data)}`));
        });
        
      } catch (error) {
        console.error(chalk.red("❌ Failed to get Web3 events:"), error.message);
        process.exit(1);
    }
  });

// Monitoring command
program
  .command("monitoring")
  .description("Monitoring operations")
  .addCommand(
    new Command("metrics").description("Get monitoring metrics")
      .argument("[service]", "Service name")
  )
  .addCommand(
    new Command("health").description("Get health checks")
  )
  .action(async (command, args) => {
    if (command === "metrics") {
      console.log(chalk.blue("🔍 Getting monitoring metrics..."));
      
      try {
        const metrics = await cli.monitoring(args.service);
        console.log(chalk.green(`🔍 Monitoring Metrics:`));
        
        metrics.forEach((metric, index) => {
          console.log(chalk.white(`  ${index + 1}. ${metric.name}: ${metric.current_value}${metric.unit}`));
          console.log(chalk.gray(`     Status: ${metric.status}`));
          console.log(chalk.gray(`     Threshold: ${metric.threshold}${metric.unit}`));
          console.log(chalk.gray(`     Updated: ${metric.last_updated}`));
        });
        
      } catch (error) {
        console.error(chalk.red("❌ Failed to get monitoring metrics:"), error.message);
        process.exit(1);
    }
    
    if (command === "health") {
      console.log(chalk.blue("🔍 Getting health checks..."));
      
      try {
        const health = await cli.security.health();
        console.log(chalk.green(`🔍 Security Health:`));
        
        health.forEach((check, index) => {
          console.log(chalk.white(`  ${index + 1}. ${check.service}: ${check.status}`));
          console.log(chalk.gray(`     Response Time: ${check.response_time}ms`));
          console.log(chalk.gray(`     Dependencies: ${check.dependencies.join(", ")}`));
        });
        
      } catch (error) {
        console.error(chalk.red("❌ Failed to get health checks:"), error.message);
        process.exit(1);
    }
  });

// Security command
program
  .command("security")
  .description("Security operations")
  .addCommand(
    new Command("health").description("Get security health")
  )
  .addCommand(
    new Command("incidents").description("Get security incidents")
      .option("-s, --severity <severity>", "Filter by severity")
      .option("-t, --type <type>", "Filter by type")
      .option("-l, --limit <limit>", "Limit results", "10")
  )
  .action(async (command, options) => {
    if (command === "health") {
      console.log(chalk.blue("🔍 Getting security health..."));
      
      try {
        const health = await cli.security.health();
        console.log(chalk.green(`🔍 Security Health:`));
        
        health.forEach((check, index) => {
          console.log(chalk.white(`  ${index + 1}. ${check.service}: ${check.status}`));
          console.log(chalk.gray(`     Response Time: ${check.response_time}ms`));
          console.log(chalk.gray(`     Dependencies: ${check.dependencies.join(", ")}`));
        });
        
      } catch (error) {
        console.error(chalk.red("❌ Failed to get security health:"), error.message);
        process.exit(1);
    }
    
    if (command === "incidents") {
      console.log(chalk.blue("🔍 Getting security incidents..."));
      
      try {
        const incidents = await cli.security.incidents({
          severity: options.severity,
          type: options.type,
          limit: parseInt(options.limit)
        });
        
        console.log(chalk.green(`🔍 Found ${incidents.length} security incidents:`));
        
        incidents.forEach((incident, index) => {
          console.log(chalk.white(`  ${index + 1}. ${incident.title} (${incident.id})`));
          console.log(chalk.gray(`     Type: ${incident.type}`));
          console.log(chalk.gray(`     Severity: ${incident.severity}`));
          console.log(chalk.gray(`     Status: ${incident.status}`));
          console.log(chalk.gray(`     Created: ${incident.created_at}`));
        });
        
      } catch (error) {
        console.error(chalk.red("❌ Failed to get security incidents:"), error.message);
        process.exit(1);
    }
  });

// Audit command
program
  .command("audit")
  .description("Audit operations")
  .addCommand(
    new Command("logs").description("Get audit logs")
      .option("-t, --tenant-id <tenant-id>", "Tenant ID")
      .option("-u, --user-id <user-id>", "User ID")
      .option("-f, --from <from>", "From date (YYYY-MM-DD)")
      .option("-to, --to <to>", "To date (YYYY-MM-DD)")
      .option("-s, --search <search>", "Search term")
      .option("-l, --limit <limit>", "Limit results", "10")
  )
  .action(async (command, options) => {
    if (command === "logs") {
      console.log(chalk.blue("📊 Getting audit logs..."));
      
      try {
        const logs = await cli.audit.logs({
          tenant_id: options.tenantId,
          user_id: options.userId,
          date_from: options.from,
          date_to: options.to,
          search: options.search,
          limit: parseInt(options.limit)
        });
        
        console.log(chalk.green(`📊 Found ${logs.length} audit logs:`));
        
        logs.forEach((log, index) => {
          console.log(chalk.white(`  ${index + 1}. ${log.action}: ${log.resource}`));
          console.log(chalk.gray(`     User: ${log.user_id}`));
          console.log(chalk.gray(`     Tenant: ${log.tenant_id}`));
          console.log(chalk.gray(`     Severity: ${log.severity}`));
          console.log(chalk.gray(`     Timestamp: ${log.timestamp}`));
          console.log(chalk.gray(`     IP: ${log.ip_address}`));
        });
        
      } catch (error) {
        console.error(chalk.red("❌ Failed to get audit logs:"), error.message);
        process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
