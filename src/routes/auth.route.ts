import { Hono } from "hono";
import * as authController from "../controllers/auth.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const authRoutes = new Hono();

authRoutes.post("/signup", ...authController.signup);
authRoutes.post("/login", ...authController.login);
authRoutes.post("/refresh", ...authController.refresh);
authRoutes.post("/logout", ...authController.logout);
authRoutes.post("/validate", requireAuth, ...authController.validate);
authRoutes.delete("/delete", requireAuth, ...authController.delete_user);
authRoutes.patch("/update", requireAuth, ...authController.update_user);
authRoutes.get("/user", requireAuth, ...authController.get_user_data);
authRoutes.get(
  "/user/preferences",
  requireAuth,
  ...authController.get_user_preferences
);
authRoutes.get(
  "/user/permissions",
  requireAuth,
  ...authController.get_user_permissions
);

export default authRoutes;
