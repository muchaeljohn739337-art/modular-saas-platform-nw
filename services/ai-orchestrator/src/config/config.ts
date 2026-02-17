import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4005,
  db: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/advancia_ai"
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379"
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "4000"),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7")
  },
  langchain: {
    apiKey: process.env.LANGCHAIN_API_KEY || "",
    baseUrl: process.env.LANGCHAIN_BASE_URL || "https://api.langchain.com"
  },
  agents: {
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || "10"),
    taskTimeout: parseInt(process.env.TASK_TIMEOUT || "300000"), // 5 minutes
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || "3")
  },
  serviceName: "ai-orchestrator"
};
