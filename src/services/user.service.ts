import { db } from "./db.service";
import {
  users,
  userPreferences,
  refreshTokens,
} from "../models/drizzle.schema";
import { eq } from "drizzle-orm";
import {
  registerRequestSchema,
  registerResponseSchema,
  loginResponseSchema,
  validateResponseSchema,
  logoutResponseSchema,
  authTokensResponseSchema,
  updateUserRequestSchema,
} from "../models/auth.schema";
import { z } from "zod";
import type { NewUserPreference } from "../models/drizzle.schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "supersecretrefreshtokenkey";

type RegisterUser = z.infer<typeof registerRequestSchema>;
type UpdateUser = z.infer<typeof updateUserRequestSchema>;

interface UserPayload {
  user_id: string;
  email: string;
  name?: string | null;
  push_token?: string | null;
}

type AuthTokens = z.infer<typeof authTokensResponseSchema>;

const generateTokens = async (user: UserPayload): Promise<AuthTokens> => {
  const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  }); // Longer expiry for refresh token

  // Decode the access token to get its iat
  const decodedAccessToken = jwt.decode(accessToken) as { iat: number };
  const iat = decodedAccessToken.iat;

  // Store refresh token hash in DB
  const refreshTokenHash = await Bun.password.hash(refreshToken);
  await db.insert(refreshTokens).values({
    id: `rft_${new Date().getTime()}`,
    user_id: user.user_id,
    token_hash: refreshTokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600, // 1 hour
    refresh_token: refreshToken,
    iat: iat, // Return iat
  };
};

export const signup_service = async (
  userData: RegisterUser
): Promise<z.infer<typeof registerResponseSchema>> => {
  const { email, password, name, push_token } = userData;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length > 0) {
    return {
      success: false,
      error: "DUPLICATE_ENTRY",
      message: "A user with this email already exists",
    };
  }

  const passwordHash = await Bun.password.hash(password);

  const newUser = await db.transaction(async (tx) => {
    const insertedUser = await tx
      .insert(users)
      .values({
        id: `user_${new Date().getTime()}`,
        email,
        password_hash: passwordHash,
        name,
        push_token,
      })
      .returning();

    const preferences: NewUserPreference = {
      id: `pref_${new Date().getTime()}`,
      user_id: insertedUser[0]!.id,
      email_enabled: userData.preferences.email_enabled,
      push_enabled: userData.preferences.push_enabled,
      language: userData.preferences.language,
      email_frequency: userData.preferences.email_frequency,
      push_frequency: userData.preferences.push_frequency,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await tx.insert(userPreferences).values(preferences);

    return insertedUser[0];
  });

  if (!newUser) {
    return {
      success: false,
      error: "USER_CREATION_FAILED",
      message: "Failed to register user",
    };
  }

  return {
    success: true,
    data: {
      user_id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      push_token: newUser.push_token,
      created_at: newUser.created_at,
      preferences: {
        email_enabled: userData.preferences.email_enabled,
        push_enabled: userData.preferences.push_enabled,
        language: userData.preferences.language,
        email_frequency: userData.preferences.email_frequency,
        push_frequency: userData.preferences.push_frequency,
      },
    },
    message: "User registered successfully",
  };
};

type LoginUserResponse = z.infer<typeof loginResponseSchema>;

export const login_service = async (
  email: string,
  password: string
): Promise<LoginUserResponse> => {
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  const user = userResult[0];

  if (!user) {
    return {
      success: false,
      error: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
    };
  }

  const isValidPassword = await Bun.password.verify(
    password,
    user.password_hash!
  );
  if (!isValidPassword) {
    return {
      success: false,
      error: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
    };
  }

  await db
    .update(users)
    .set({ last_login: new Date() })
    .where(eq(users.id, user.id));

  // Invalidate all existing refresh tokens for the user
  await db.delete(refreshTokens).where(eq(refreshTokens.user_id, user.id));

  const tokens = await generateTokens({
    user_id: user.id!,
    email: user.email!,
    name: user.name,
    push_token: user.push_token,
  });

  // Update revoked_at timestamp for the user to invalidate all previous access tokens.
  // Set it to the iat of the newly generated token to ensure the new token is valid.
  await db
    .update(users)
    .set({ revoked_at: new Date(tokens.iat * 1000) })
    .where(eq(users.id, user.id));

  // Fetch user preferences
  const userPrefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.user_id, user.id));

  const prefs = userPrefs[0];

  return {
    success: true,
    data: {
      user_id: user.id,
      email: user.email,
      name: user.name,
      push_token: user.push_token,
      preferences: {
        email_enabled: prefs?.email_enabled ?? true,
        push_enabled: prefs?.push_enabled ?? true,
        language: (prefs?.language as "en" | "es" | "fr") ?? "en",
        email_frequency: prefs?.email_frequency ?? 1440,
        push_frequency: prefs?.push_frequency ?? 1440,
      },
      ...tokens,
    },
    message: "Login successful",
  };
};

type RefreshAccessTokenResponse = z.infer<typeof loginResponseSchema>;

export const refresh_service = async (
  refreshToken: string
): Promise<RefreshAccessTokenResponse> => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET
    ) as UserPayload;

    const userRefreshTokens = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.user_id, decoded.user_id));

    let storedToken: typeof refreshTokens.$inferSelect | undefined = undefined;

    for (const token of userRefreshTokens) {
      if (token.token_hash === null) {
        continue;
      }
      const isValid = await Bun.password.verify(refreshToken, token.token_hash);
      if (isValid) {
        storedToken = token;
        break;
      }
    }

    if (!storedToken || storedToken.expires_at! < new Date()) {
      return {
        success: false,
        error: "INVALID_TOKEN",
        message: "Invalid or expired refresh token",
      };
    }

    // Invalidate old refresh token
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.token_hash, storedToken.token_hash!));

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.user_id));

    if (!user[0]) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found",
      };
    }

    const tokens = await generateTokens({
      user_id: user[0].id!,
      email: user[0].email!,
      name: user[0].name,
      push_token: user[0].push_token,
    });

    // Update revoked_at timestamp for the user to invalidate all previous access tokens.
    // Set it to the iat of the newly generated token to ensure the new token is valid.
    await db
      .update(users)
      .set({ revoked_at: new Date(tokens.iat * 1000) })
      .where(eq(users.id, user[0].id));

    // Fetch user preferences
    const userPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.user_id, user[0].id));

    const prefs = userPrefs[0];

    return {
      success: true,
      data: {
        user_id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        push_token: user[0].push_token,
        preferences: {
          email_enabled: prefs?.email_enabled ?? true,
          push_enabled: prefs?.push_enabled ?? true,
          language: (prefs?.language as "en" | "es" | "fr") ?? "en",
          email_frequency: prefs?.email_frequency ?? 1440,
          push_frequency: prefs?.push_frequency ?? 1440,
        },
        ...tokens,
      },
      message: "Token refreshed successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: "INVALID_TOKEN",
      message: "Invalid or expired refresh token",
    };
  }
};

type ValidateTokenResponse = z.infer<typeof validateResponseSchema>;

export const validate_service = async (
  accessToken: string
): Promise<ValidateTokenResponse> => {
  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as UserPayload & {
      iat: number;
    };
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.user_id));
    const user = userResult[0];

    if (!user) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found",
      };
    }

    // Check if the token was issued before the last revocation event
    if (user.revoked_at && decoded.iat * 1000 < user.revoked_at.getTime()) {
      return {
        success: false,
        error: "TOKEN_REVOKED",
        message: "Access token has been revoked",
      };
    }

    // Fetch user preferences
    const userPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.user_id, user.id));

    const prefs = userPrefs[0];

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        push_token: user.push_token,
        preferences: {
          email_enabled: prefs?.email_enabled ?? true,
          push_enabled: prefs?.push_enabled ?? true,
          language: (prefs?.language as "en" | "es" | "fr") ?? "en",
          email_frequency: prefs?.email_frequency ?? 1440,
          push_frequency: prefs?.push_frequency ?? 1440,
        },
        is_active: true,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        permissions: ["notifications:create", "notifications:read"], // Placeholder permissions
      },
      message: "Token is valid",
    };
  } catch (error) {
    return {
      success: false,
      error: "INVALID_TOKEN",
      message: "Invalid or expired access token",
    };
  }
};

type LogoutUserResponse = z.infer<typeof logoutResponseSchema>;

export const logout_service = async (
  email: string,
  password: string
): Promise<LogoutUserResponse> => {
  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    const user = userResult[0];

    if (!user) {
      return {
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      };
    }

    const isValidPassword = await Bun.password.verify(
      password,
      user.password_hash!
    );
    if (!isValidPassword) {
      return {
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      };
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.user_id, user.id));

    // Update revoked_at timestamp for the user to invalidate all previous access tokens
    await db
      .update(users)
      .set({ revoked_at: new Date() })
      .where(eq(users.id, user.id));

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: "SERVER_ERROR",
      message: "An error occurred while logging out",
    };
  }
};

export const delete_service = async (
  email: string,
  password: string
): Promise<LogoutUserResponse> => {
  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    const user = userResult[0];

    if (!user) {
      return {
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      };
    }

    const isValidPassword = await Bun.password.verify(
      password,
      user.password_hash!
    );
    if (!isValidPassword) {
      return {
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      };
    }

    await db.transaction(async (tx) => {
      // Delete user preferences
      await tx
        .delete(userPreferences)
        .where(eq(userPreferences.user_id, user.id));

      // Delete refresh tokens
      await tx.delete(refreshTokens).where(eq(refreshTokens.user_id, user.id));

      // Delete the user
      await tx.delete(users).where(eq(users.id, user.id));
    });

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: "DELETE_FAILED",
      message: "Failed to delete user",
    };
  }
};

export const update_service = async (
  userId: string,
  userData: UpdateUser
): Promise<z.infer<typeof registerResponseSchema>> => {
  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    const user = userResult[0];

    if (!user) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found",
      };
    }

    const updateFields: Partial<typeof users.$inferInsert> = {
      updated_at: new Date(),
    };

    if (userData.email && userData.email !== user.email) {
      const existingUserWithEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      if (existingUserWithEmail.length > 0) {
        return {
          success: false,
          error: "DUPLICATE_EMAIL",
          message: "Email already in use",
        };
      }
      updateFields.email = userData.email;
    }

    if (userData.password) {
      updateFields.password_hash = await Bun.password.hash(userData.password);
    }
    if (userData.name) {
      updateFields.name = userData.name;
    }
    if (userData.push_token) {
      updateFields.push_token = userData.push_token;
    }

    const updatedUser = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser[0]) {
      return {
        success: false,
        error: "UPDATE_FAILED",
        message: "Failed to update user",
      };
    }

    // Update preferences if provided
    if (userData.preferences) {
      await db
        .update(userPreferences)
        .set({
          email_enabled: userData.preferences.email_enabled,
          push_enabled: userData.preferences.push_enabled,
          language: userData.preferences.language,
          email_frequency: userData.preferences.email_frequency,
          push_frequency: userData.preferences.push_frequency,
          updated_at: new Date(),
        })
        .where(eq(userPreferences.user_id, userId));
    }

    // Fetch updated preferences
    const userPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.user_id, userId));

    const prefs = userPrefs[0];

    return {
      success: true,
      data: {
        user_id: updatedUser[0].id,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        push_token: updatedUser[0].push_token,
        preferences: {
          email_enabled: prefs?.email_enabled ?? true,
          push_enabled: prefs?.push_enabled ?? true,
          language: (prefs?.language as "en" | "es" | "fr") ?? "en",
          email_frequency: prefs?.email_frequency ?? 1440,
          push_frequency: prefs?.push_frequency ?? 1440,
        },
        created_at: updatedUser[0].created_at,
      },
      message: "User updated successfully",
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: "SERVER_ERROR",
      message: "An error occurred while updating user",
    };
  }
};
