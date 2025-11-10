import { createFactory } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { customLogger } from "../utils/logger";
import {
  loginRequestSchema,
  refreshTokenRequestSchema,
  registerRequestSchema,
  logoutRequestSchema,
  deleteUserRequestSchema,
  updateUserRequestSchema,
} from "../models/auth.schema";
import {
  login_service,
  refresh_service,
  signup_service,
  validate_service,
  logout_service,
  delete_service,
  update_service,
} from "../services/user.service";

const factory = createFactory();

export const signup = factory.createHandlers(
  zValidator("json", registerRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message:
            "Invalid request parameters - expects JSON body of email, password, first_name, last_name,",
        },
        422
      );
    }
  }),
  async (c) => {
    try {
      const userData = c.req.valid("json");
      const response = await signup_service(userData);

      if (!response.success) {
        return c.json(response, 409);
      }

      return c.json(response, 201);
    } catch (error) {
      customLogger(error, "signup");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const login = factory.createHandlers(
  zValidator("json", loginRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message:
            "Invalid request parameters - expects JSON body of email and password",
        },
        422
      );
    }
  }),
  async (c) => {
    try {
      const { email, password } = c.req.valid("json");
      const response = await login_service(email, password);

      if (!response.success) {
        return c.json(response, 401);
      }

      return c.json(response);
    } catch (error) {
      customLogger(error, "login");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const refresh = factory.createHandlers(
  zValidator("json", refreshTokenRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message: "Invalid request parameters - expects a refresh_token",
        },
        422
      );
    }
  }),
  async (c) => {
    try {
      const { refresh_token } = c.req.valid("json");
      const response = await refresh_service(refresh_token);

      if (!response.success) {
        return c.json(response, 401);
      }

      return c.json(response);
    } catch (error) {
      customLogger(error, "refresh");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const validate = factory.createHandlers(async (c) => {
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
    const response = await validate_service(accessToken);

    if (!response.success) {
      return c.json(response, 401);
    }

    return c.json(response);
  } catch (error) {
    customLogger(error, "validate");
    return c.json({ status: 500, message: "Something went wrong" }, 500);
  }
});

export const logout = factory.createHandlers(
  zValidator("json", logoutRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message:
            "Invalid request parameters - expects JSON body of email and password",
        },
        422
      );
    }
  }),
  async (c) => {
    try {
      const { email, password } = c.req.valid("json");
      const response = await logout_service(email, password);

      if (!response.success) {
        return c.json(response, 400);
      }

      return c.json(response);
    } catch (error) {
      customLogger(error, "logout");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const delete_user = factory.createHandlers(
  zValidator("json", deleteUserRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message:
            "Invalid request parameters - expects JSON body of email and password",
        },
        422
      );
    }
  }),
  async (c) => {
    try {
      const { email, password } = c.req.valid("json");
      const response = await delete_service(email, password);

      if (!response.success) {
        return c.json(response, 400);
      }

      return c.json(response);
    } catch (error) {
      customLogger(error, "delete_user");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const update_user = factory.createHandlers(
  zValidator("json", updateUserRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message:
            "Invalid request parameters - expects JSON body with optional email, password, first_name, last_name",
        },
        422
      );
    }
  }),
  async (c) => {
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

      const userId = validationResponse.data.id;
      const userData = c.req.valid("json");
      const response = await update_service(userId, userData);

      if (!response.success) {
        return c.json(response, 400);
      }

      return c.json(response);
    } catch (error) {
      customLogger(error, "update_user");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);
