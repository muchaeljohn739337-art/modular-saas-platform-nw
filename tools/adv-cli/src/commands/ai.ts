import { Command } from "commander";
import { AI } from "@advancia/sdk";
import { getAuth, getApiUrl } from "../utils/auth";
import { success, error, spinner, printTable, printJson } from "../utils/printer";

const cmd = new Command("ai");

cmd
  .description("Manage AI agents and tasks")
  .option("-j, --json", "Output in JSON format");

// List AI agents
cmd
  .command("agents")
  .description("List available AI agents")
  .option("-t, --type <type>", "Filter by agent type")
  .option("-s, --status <status>", "Filter by status")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching AI agents...");
      loading.start();
      
      try {
        const ai = AI(getApiUrl(), token);
        const response = await ai.list({
          type: options.type,
          status: options.status
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Found ${response.data.length} AI agents`);
          
          if (response.data.length > 0) {
            const headers = ["ID", "Name", "Type", "Status", "Success Rate", "Avg Time"];
            const rows = response.data.map((agent: any) => [
              agent.id,
              agent.name,
              agent.agent_type,
              agent.enabled ? "Enabled" : "Disabled",
              `${agent.success_rate}%`,
              `${agent.avg_execution_time}s`
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch AI agents: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Run AI agent
cmd
  .command("run <agentId>")
  .description("Run an AI agent")
  .option("-t, --tenant <tenant>", "Tenant ID")
  .option("-u, --user <user>", "User ID")
  .option("-p, --priority <priority>", "Priority (low|medium|high|critical)", "medium")
  .option("-i, --input <input>", "Input data (JSON string)")
  .action(async (agentId, options) => {
    try {
      const { token } = getAuth();
      
      let inputData = {};
      if (options.input) {
        try {
          inputData = JSON.parse(options.input);
        } catch (e) {
          error("Invalid JSON input data");
          process.exit(1);
        }
      }
      
      const loading = spinner("Running AI agent...");
      loading.start();
      
      try {
        const ai = AI(getApiUrl(), token);
        const response = await ai.run(agentId, {
          tenant_id: options.tenant,
          user_id: options.user,
          priority: options.priority,
          parameters: inputData
        });
        
        loading.stop();
        
        success(`AI agent "${agentId}" started successfully`);
        printJson(response.data, "Task Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to run AI agent: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// List AI tasks
cmd
  .command("tasks")
  .description("List AI agent tasks")
  .option("-s, --status <status>", "Filter by status")
  .option("-t, --type <type>", "Filter by agent type")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching AI tasks...");
      loading.start();
      
      try {
        const ai = AI(getApiUrl(), token);
        const response = await ai.listTasks({
          status: options.status,
          type: options.type,
          limit: parseInt(options.limit)
        });
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data);
        } else {
          success(`Found ${response.data.length} AI tasks`);
          
          if (response.data.length > 0) {
            const headers = ["ID", "Agent", "Status", "Progress", "Priority", "Created"];
            const rows = response.data.map((task: any) => [
              task.id,
              task.agent_type,
              task.status,
              `${task.progress}%`,
              task.priority,
              task.created_at
            ]);
            printTable(headers, rows);
          }
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch AI tasks: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Get task details
cmd
  .command("task <taskId>")
  .description("Get AI task details")
  .action(async (taskId) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching task details...");
      loading.start();
      
      try {
        const ai = AI(getApiUrl(), token);
        const response = await ai.getTask(taskId);
        
        loading.stop();
        
        success("Task Details:");
        printJson(response.data);
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch task details: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

// Stop AI task
cmd
  .command("stop <taskId>")
  .description("Stop a running AI task")
  .action(async (taskId) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Stopping AI task...");
      loading.start();
      
      try {
        const ai = AI(getApiUrl(), token);
        const response = await ai.stopTask(taskId);
        
        loading.stop();
        
        success(`AI task "${taskId}" stopped successfully`);
        printJson(response.data, "Task Details");
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to stop AI task: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
