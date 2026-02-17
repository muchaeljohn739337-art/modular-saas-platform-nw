import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_PATH = path.join(os.homedir(), ".advancia.json");

export interface Config {
  token?: string;
  tenantId?: string;
  apiUrl?: string;
  defaultTenant?: string;
  lastLogin?: string;
}

export const saveConfig = (data: Config): void => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
};

export const loadConfig = (): Config => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return {};
    }
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load config: ${error.message}`);
  }
};

export const clearConfig = (): void => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }
  } catch (error) {
    throw new Error(`Failed to clear config: ${error.message}`);
  }
};

export const getConfigPath = (): string => {
  return CONFIG_PATH;
};
