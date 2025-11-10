import { Hono } from "hono";
import * as HealthController from "../controllers/health.controller.ts";

const healthRoutes = new Hono();

healthRoutes.get("/", ...HealthController.get_health);

export default healthRoutes;
