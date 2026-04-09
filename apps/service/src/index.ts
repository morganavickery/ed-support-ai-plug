import { buildApp } from "./app.js";
import { getConfig } from "./config.js";

const config = getConfig();
const app = buildApp(config);

async function start() {
  try {
    await app.listen({
      host: config.host,
      port: config.port,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
