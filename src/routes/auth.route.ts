import { Hono } from "hono";
import * as authController from "../controllers/auth.controller.ts";

const authRoutes = new Hono();

authRoutes.post("/signup", ...authController.signup);
authRoutes.post("/login", ...authController.login);
authRoutes.post("/refresh", ...authController.refresh);
authRoutes.post("/validate", ...authController.validate);
authRoutes.post("/logout", ...authController.logout);
authRoutes.delete("/delete", ...authController.delete_user);
authRoutes.patch("/update", ...authController.update_user);

export default authRoutes;
