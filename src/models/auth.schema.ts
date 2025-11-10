import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string(),
});

export const registerRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 6 characters long"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

// Response schemas
export const registerResponseDataSchema = z.object({
  user_id: z.string(),
  email: z.email().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  created_at: z.date().nullable(),
});

export const registerResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: registerResponseDataSchema,
    message: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    message: z.string(),
  }),
]);

export const authTokensResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("Bearer"),
  expires_in: z.number(),
  refresh_token: z.string(),
  iat: z.number(),
});

export const loginResponseDataSchema = z
  .object({
    user_id: z.string(),
    email: z.email().nullable(),
  })
  .merge(authTokensResponseSchema);

export const loginResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: loginResponseDataSchema,
    message: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    message: z.string(),
  }),
]);

export const validateResponseDataSchema = z.object({
  id: z.string(),
  email: z.email().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
  last_login: z.date().nullable(),
  permissions: z.array(z.string()),
});

export const validateResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    data: validateResponseDataSchema,
    message: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    message: z.string(),
  }),
]);

export const logoutResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    message: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    message: z.string(),
  }),
]);

export const logoutRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const deleteUserRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const updateUserRequestSchema = z.object({
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});
