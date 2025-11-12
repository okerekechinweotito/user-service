import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { logger } from "hono/logger";
import { bunLogger as customLogger } from "./utils/logger.ts";
import healthRoutes from "./routes/health.route.ts";
import authRoutes from "./routes/auth.route.ts";
import { Scalar } from "@scalar/hono-api-reference";

const app = new Hono().basePath("/api/v1");

app.use("*", cors());
app.use("*", prettyJSON());

app.use("*", logger());

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
  const baseUrl = new URL(c.req.url).origin;
  return c.json(
    {
      status: "ok",
      message: "Welcome to the Notifications API",
      docs: {
        scalar: `${baseUrl}/api/v1/reference`,
        swagger: `${baseUrl}/api/v1/ui`,
        openapi: `${baseUrl}/api/v1/doc`,
      },
    },
    200
  );
});

app.route("/health", healthRoutes);
app.route("/auth", authRoutes);


app.get("/doc", async (c) => {
  const openapi = await Bun.file("./docs/openapi.json").json();
  return c.json(openapi);
});

app.get("/ui", swaggerUI({ url: "/api/v1/doc" }));
app.get(
  "/reference",
  Scalar({
    url: "/api/v1/doc",
    theme: "purple",
    pageTitle: "User Service API",
  })
);

export default app;