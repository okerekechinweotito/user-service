import { createFactory } from "hono/factory";
import { bunLogger } from "../utils/logger.ts";
import { getHealthStatus } from "../services/health.service";

const factory = createFactory();

export const get_health = factory.createHandlers(async (c) => {
  try {
    const healthStatus = await getHealthStatus();
    const statusCode =
      healthStatus.status === "down"
        ? 503
        : healthStatus.status === "degraded"
        ? 200
        : 200;

    return c.json(healthStatus, statusCode);
  } catch (error) {
    bunLogger.error("get_health error", { context: { error } });
    return c.json(
      {
        status: "down",
        error: "HEALTH_CHECK_FAILED",
        message: "Failed to perform health check",
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});
