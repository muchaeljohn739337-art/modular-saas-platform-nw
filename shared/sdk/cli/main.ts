import { cli } from "./cli";

// Create a comprehensive example script
const main = async () => {
  console.log("🚀 Advancia CLI Tool");
  
  try {
    // Test authentication
    const authResult = await cli.login("admin@advanciapayledger.com", "admin123");
    console.log("✅ Authenticated as admin");
    
    // Test tenant operations
    const tenants = await cli.tenants();
    console.log(`📊 Found ${tenants.length} tenants`);
    
    // Test billing operations
    const billingStats = await cli.billing("tenant-123");
    console.log("📊 Monthly Revenue:", billingStats.monthly_revenue);
    
    // Test AI operations
    const aiTasks = await cli.ai.list();
    console.log("🤖 AI Tasks:", aiTasks.length);
    
    // Test Web3 operations
    const web3Events = await cli.web3.events();
    console.log("🔗 Web3 Events:", web3Events.length);
    
    // Test monitoring
    const healthChecks = await cli.security.health();
    console.log("🟡 Security Health:", healthChecks.every(check => check.status === "healthy"));
    
    // Test audit operations
    const auditLogs = await cli.audit.logs({
      tenant_id: "tenant-123",
      date_from: "2024-01-01",
      date_to: "2024-01-31"
    });
    console.log("📊 Audit Logs:", auditLogs.length);
    
    console.log("✅ All CLI operations completed successfully!");
    
  } catch (error) {
    console.error("❌ CLI Error:", error.message);
    console.error("🔥 Error details:", error.response?.data?.details);
    process.exit(1);
  }
};

// Run the main function if this file is executed
if (require.main === module) {
  main();
}
