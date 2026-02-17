import { Command } from "commander";
import { Auth } from "@advancia/sdk";
import { getAuth, getApiUrl } from "../utils/auth";
import { success, error, spinner, printJson } from "../utils/printer";

const cmd = new Command("whoami");

cmd
  .description("Show current user information")
  .option("-j, --json", "Output in JSON format")
  .action(async (options) => {
    try {
      const { token } = getAuth();
      
      const loading = spinner("Fetching user information...");
      loading.start();
      
      try {
        const auth = Auth(getApiUrl());
        const response = await auth.me();
        
        loading.stop();
        
        if (options.json) {
          printJson(response.data, "Current User");
        } else {
          success("Current User Information:");
          printJson(response.data);
        }
        
      } catch (err: any) {
        loading.stop();
        error(`Failed to fetch user information: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Authentication error: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
