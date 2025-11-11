import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { logger } from "hono/logger";
import { bunLogger as customLogger } from "./utils/logger.ts";
import healthRoutes from "./routes/health.route.ts";
import authRoutes from "./routes/auth.route.ts";

const app = new Hono().basePath("/api/v1");

app.use("*", cors());
app.use("*", prettyJSON());

// Hono built-in request logger
app.use("*", logger());

// Custom global request logging middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  customLogger.info("Request", {
    context: {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
      ip:
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "unknown",
    },
  });
});

app.get("/", (c) => {
  return c.json(
    {
      status: "ok",
      message: "Welcome to the Notifications API",
    },
    200
  );
});

app.route("/health", healthRoutes);
app.route("/auth", authRoutes);
// admin routes removed

export default app;
