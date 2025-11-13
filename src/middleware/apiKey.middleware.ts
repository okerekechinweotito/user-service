import type { Context, Next } from "hono";
import { bunLogger } from "../utils/logger";

export const apiKeyMiddleware = async (c: Context, next: Next) => {
  try {
    const apiKey = c.req.header("x-api-key");
    
    if (!apiKey) {
      return c.json(
        { 
          success: false, 
          error: "MISSING_API_KEY",
          message: "API key is required" 
        }, 
        401
      );
    }

    const expectedApiKey = process.env.X_API_KEY;
    
    if (!expectedApiKey) {
      bunLogger.error("X_API_KEY environment variable not set");
      return c.json(
        { 
          success: false, 
          error: "SERVER_CONFIG_ERROR",
          message: "Server configuration error" 
        }, 
        500
      );
    }

    if (apiKey !== expectedApiKey) {
      return c.json(
        { 
          success: false, 
          error: "INVALID_API_KEY",
          message: "Invalid API key" 
        }, 
        403
      );
    }

    await next();
  } catch (error) {
    bunLogger.error("apiKeyMiddleware error", { context: { error } });
    return c.json(
      { 
        success: false, 
        error: "INTERNAL_ERROR",
        message: "Something went wrong" 
      }, 
      500
    );
  }
};
