import { z } from "zod";
import type { User } from "./drizzle.schema";

export interface AuthUserType extends Partial<Omit<User, "password_hash">> {
  id: string;
  email: string;
  name: string;
  preferences: {
    email_enabled: boolean;
    push_enabled: boolean;
    language: "en" | "es" | "fr";
    email_frequency: number;
    push_frequency: number;
  };
  permissions: string[];
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUserType;
  }
}
export const UserPreferenceSchema = z
  .object({
    email_enabled: z.boolean().default(true),
    push_enabled: z.boolean().default(true),
    language: z.enum(["en", "es", "fr"]).default("en"),
    email_frequency: z.number().int().min(1).max(10080).default(1440),
    push_frequency: z.number().int().min(1).max(10080).default(1440),
  })
  .strict();

export const loginRequestSchema = z
  .object({
    email: z.email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

export const refreshTokenRequestSchema = z
  .object({
    refresh_token: z.string(),
  })
  .strict();

export const registerRequestSchema = z
  .object({
    email: z.email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    push_token: z.string().optional(),
    preferences: UserPreferenceSchema,
  })
  .strict();

export const updateUserRequestSchema = z
  .object({
    email: z.string().email("Invalid email format").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    push_token: z.string().min(1, "Push token cannot be empty").optional(),
    preferences: z
      .object({
        email_enabled: z.boolean().optional(),
        push_enabled: z.boolean().optional(),
        language: z.enum(["en", "es", "fr"]).optional(),
        email_frequency: z.number().int().min(1).max(10080).optional(),
        push_frequency: z.number().int().min(1).max(10080).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      return Object.keys(data).length > 0;
    },
    {
      message: "At least one field must be provided for update",
    }
  );

export const logoutRequestSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
  })
  .strict();

export const deleteUserRequestSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
  })
  .strict();

export const registerResponseDataSchema = z.object({
  user_id: z.string(),
  email: z.email(),
  name: z.string(),
  push_token: z.string().optional().nullable(),
  preferences: UserPreferenceSchema,
  created_at: z.date(),
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
    name: z.string(),
    push_token: z.string().optional().nullable(),
    preferences: UserPreferenceSchema,
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
  email: z.email(),
  name: z.string(),
  push_token: z.string().optional().nullable(),
  preferences: UserPreferenceSchema,
  is_active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
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
