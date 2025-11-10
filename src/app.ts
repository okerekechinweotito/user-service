import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { logger } from "hono/logger";
import healthRoutes from "./routes/health.route.ts";
import authRoutes from "./routes/auth.route.ts";

const app = new Hono().basePath("/api/v1");

app.use("*", cors());
app.use("*", prettyJSON());
app.use("*", logger());

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

export default app;
