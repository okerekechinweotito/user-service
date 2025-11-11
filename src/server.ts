import app from "./app.ts";
import { bunLogger as customLogger } from "./utils/logger.ts";

const port = Number(process.env.PORT) || 3000;

const server = Bun.serve({
  port: port,
  fetch: app.fetch,
});

customLogger.info(
  `Server is running at http://${server.hostname}:${server.port}`
);

process.once("SIGTERM", () => {
  try {
    server.stop();
  } catch (error) {
    customLogger.error("SIGTERM signal received", { context: { error } });
    process.exit(1);
  }
});

