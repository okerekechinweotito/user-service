import { createFactory } from "hono/factory";
import { customLogger } from "../utils/logger.ts";
import { checkDbHealth } from "../services/db.service";

const factory = createFactory();

export const get_health = factory.createHandlers(async (c) => {
  try {
    const dbStatus = await checkDbHealth();
    const overallStatus = dbStatus ? "ok" : "degraded";
    const statusCode = dbStatus ? 200 : 500;

    return c.json(
      {
        status: overallStatus,
        service: "user-service",
        database: dbStatus ? "ok" : "not ok",
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  } catch (error) {
    customLogger(error, "get_health");
    return c.json({ status: 500, message: "Something went wrong" }, 500);
  }
});
