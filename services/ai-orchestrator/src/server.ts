import { createApp } from "./app";
import { config } from "./config/config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`AI Orchestrator service listening on port ${config.port}`);
});
