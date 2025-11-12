import type { Context, Next } from "hono";
import { validate_service } from "../services/user.service";
import { bunLogger } from "../utils/logger";
import type { AuthUserType } from "../models/auth.schema";

export const requireAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      return c.json(
        { success: false, message: "Invalid access token format" },
        401
      );
    }

    const validationResponse = await validate_service(accessToken);
    if (!validationResponse.success) {
      return c.json(validationResponse, 401);
    }

  c.set("user", validationResponse.data);

    await next();
  } catch (error) {
    bunLogger.error("requireAuth error", { context: { error } });
    return c.json({ status: 500, message: "Something went wrong" }, 500);
  }
};
