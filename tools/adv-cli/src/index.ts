import { Command } from "commander";
import login from "./commands/login";
import whoami from "./commands/whoami";
import tenants from "./commands/tenants";
import billing from "./commands/billing";
import ai from "./commands/ai";
import web3 from "./commands/web3";
import audit from "./commands/audit";
import monitoring from "./commands/monitoring";
import metering from "./commands/metering";
import { success, error, highlight } from "./utils/printer";

const program = new Command();

program
  .name("adv")
  .description("Advancia PayLedger CLI Tool")
  .version("1.0.0")
  .hook("preAction", () => {
    // Add any pre-action logic here
  });

// Add all commands
program.addCommand(login);
program.addCommand(whoami);
program.addCommand(tenants);
program.addCommand(billing);
program.addCommand(ai);
program.addCommand(web3);
program.addCommand(audit);
program.addCommand(monitoring);
program.addCommand(metering);

// Global error handler
program.exitOverride((err) => {
  error(`Command failed: ${err.message}`);
  process.exit(1);
});

// Handle unknown commands
program.on("command:*", () => {
  error("Unknown command. Use \"adv --help\" for available commands.");
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  error(`Uncaught exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Welcome message
if (process.argv.length <= 2) {
  highlight("Advancia PayLedger CLI Tool");
  console.log("Use \"adv --help\" for available commands");
  console.log("Use \"adv login\" to authenticate");
}
