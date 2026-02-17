import chalk from "chalk";
import ora from "ora";

export const success = (msg: string): void => {
  console.log(chalk.green("✅"), msg);
};

export const error = (msg: string): void => {
  console.log(chalk.red("❌"), msg);
};

export const warning = (msg: string): void => {
  console.log(chalk.yellow("⚠️"), msg);
};

export const info = (msg: string): void => {
  console.log(chalk.blue("ℹ️"), msg);
};

export const highlight = (msg: string): void => {
  console.log(chalk.cyan(msg));
};

export const dim = (msg: string): void => {
  console.log(chalk.gray(msg));
};

export const spinner = (text: string) => {
  return ora(text);
};

export const printJson = (data: any, title?: string): void => {
  if (title) {
    console.log(chalk.bold(title));
  }
  console.log(JSON.stringify(data, null, 2));
};

export const printTable = (headers: string[], rows: string[][]): void => {
  const { Table } = require("cli-table3");
  const table = new Table({
    head: headers.map(h => chalk.bold(h)),
    wordWrap: true
  });
  
  rows.forEach(row => {
    table.push(row);
  });
  
  console.log(table.toString());
};

export const printKeyValue = (data: Record<string, any>): void => {
  Object.entries(data).forEach(([key, value]) => {
    console.log(`${chalk.bold(key)}: ${value}`);
  });
};
