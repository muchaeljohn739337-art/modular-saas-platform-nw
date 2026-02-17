import { Command } from "commander";
import { Billing } from "@advancia/sdk";
import { getAuth, getApiUrl } from "../utils/auth";
import { success, error, spinner, printTable, printJson } from "../utils/printer";

const cmd = new Command("billing");

cmd
  .description("Manage billing and subscriptions")
  .option("-j, --json", "Output in JSON format");

// Get billing stats
cmd
  .command("stats <tenantId>")
  .description("Get billing statistics for a tenant")
  .action(async (tenantId) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching billing statistics...");
      loading.start();
      
      try {
        const billing = Billing(getApiUrl(), token);
        const response = await billing.getTenantStats(tenantId);
        
        loading.stop();
        
        success("Billing Statistics:");
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch billing stats: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// List invoices
cmd
  .command("invoices <tenantId>")
  .description("List invoices for a tenant")
  .option("-s, --status <status>", "Filter by status")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (tenantId, options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching invoices...");
      loading.start();
      
      try {
        const billing = Billing(getApiUrl(), token);
        const response = await billing.listInvoices({
          tenant_id: tenantId,
          status: options.status,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Found ${response.data.length} invoices`);
          
          if (response.data.length > 0) {
            const headers = ["ID", "Number", "Amount", "Status", "Due Date", "Created"];
            const rows = response.data.map((inv: any) => [
              inv.id,
              inv.invoice_number,
              `$${inv.amount}`,
              inv.status,
              inv.due_date,
              inv.created_at
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch invoices: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Create invoice
cmd
  .command("invoice <tenantId>")
  .description("Create a new invoice")
  .option("-c, --customer <customer>", "Customer ID")
  .option("-a, --amount <amount>", "Amount")
  .option("-d, --description <description>", "Description")
  .action(async (tenantId, options) => {
    try {
      const { token } = getAuth();
      
      if (!options.customer || !options.amount) {
        error("Customer ID and amount are required");
        process.exit(1);
      }
      
      const loading = spinner("Creating invoice...");
      loading.start();
      
      try {
        const billing = Billing(getApiUrl(), token);
        const response = await billing.createInvoice({
          tenant_id: tenantId,
          customer_id: options.customer,
          amount: parseFloat(options.amount),
          currency: "USD",
          description: options.description || "Invoice",
          line_items: [{
            description: options.description || "Service",
            quantity: 1,
            unit_price: parseFloat(options.amount),
            total: parseFloat(options.amount)
          }]
        });
        
        loading.stop();
        
        success("Invoice created successfully");
        printJson(response.data, "Invoice Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to create invoice: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Process payment
cmd
  .command("pay <invoiceId>")
  .description("Process payment for an invoice")
  .option("-m, --method <method>", "Payment method", "credit_card")
  .action(async (invoiceId, options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Processing payment...");
      loading.start();
      
      try {
        const billing = Billing(getApiUrl(), token);
        const response = await billing.processPayment({
          invoice_id: invoiceId,
          payment_method: options.method,
          amount: 0, // Will be calculated from invoice
          currency: "USD"
        });
        
        loading.stop();
        
        success("Payment processed successfully");
        printJson(response.data, "Payment Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to process payment: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
