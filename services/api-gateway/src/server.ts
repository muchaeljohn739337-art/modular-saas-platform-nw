import { createApp } from "./app";
import { config } from "./config/config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`🚀 API Gateway listening on port ${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`🔗 API endpoints: http://localhost:${config.port}/api/v1`);
});
