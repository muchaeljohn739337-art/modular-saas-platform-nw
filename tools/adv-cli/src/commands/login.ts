import { Command } from "commander";
import inquirer from "inquirer";
import { Auth } from "@advancia/sdk";
import { setAuth, getApiUrl } from "../utils/auth";
import { saveConfig } from "../utils/config";
import { success, error, spinner } from "../utils/printer";

const cmd = new Command("login");

cmd
  .description("Login to Advancia PayLedger")
  .argument("[email]", "Email address")
  .option("-p, --password <password>", "Password")
  .option("-t, --tenant <tenant>", "Tenant ID")
  .action(async (email?: string, options) => {
    try {
      let credentials;
      
      if (!email) {
        credentials = await inquirer.prompt([
          {
            type: "input",
            name: "email",
            message: "Email:",
            validate: (input: string) => {
              if (!input) return "Email is required";
              if (!input.includes("@")) return "Invalid email format";
              return true;
            }
          },
          {
            type: "password",
            name: "password",
            message: "Password:",
            mask: "*",
            validate: (input: string) => {
              if (!input) return "Password is required";
              return true;
            }
          }
        ]);
      } else {
        if (!options.password) {
          credentials = await inquirer.prompt([
            {
              type: "password",
              name: "password",
              message: "Password:",
              mask: "*",
              validate: (input: string) => {
                if (!input) return "Password is required";
                return true;
              }
            }
          ]);
          credentials.email = email;
        } else {
          credentials = { email, password: options.password };
        }
      }
      
      const loading = spinner("Logging in...");
      loading.start();
      
      try {
        const auth = Auth(getApiUrl());
        const response = await auth.login({
          email: credentials.email,
          password: credentials.password
        });
        
        loading.stop();
        
        setAuth(response.data.access_token, options.tenant || response.data.user.tenant_id);
        
        success(`Logged in successfully as ${response.data.user.name}`);
        console.log(`  Role: ${response.data.user.role}`);
        console.log(`  Tenant: ${response.data.user.tenant_id}`);
        
      } catch (err: any) {
        loading.stop();
        error(`Login failed: ${err.message}`);
        process.exit(1);
      }
      
    } catch (err: any) {
      error(`Login failed: ${err.message}`);
      process.exit(1);
    }
  });

export default cmd;
