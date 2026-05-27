import app from "./app";
import { logger } from "./lib/logger";
import { bootstrapAppData } from "./lib/bootstrap";

const rawPort = process.env["API_PORT"] ?? process.env["PORT"] ?? "8081";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    await bootstrapAppData();
  } catch (err) {
    logger.error({ err }, "Failed to bootstrap database/app data");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

start();
