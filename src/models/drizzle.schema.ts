import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const channelEnum = pgEnum("channel", ["email", "push", "sms"]);
export const platformEnum = pgEnum("platform", ["ios", "android", "web"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  password_hash: text("password_hash"),
  first_name: text("first_name"),
  last_name: text("last_name"),
  phone: text("phone"),
  is_active: boolean("is_active").default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  revoked_at: timestamp("revoked_at"), // New column for token revocation
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey(),
  user_id: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  channel: channelEnum("channel"),
  enabled: boolean("enabled").default(true),
  language: varchar("language").default("en"),
  frequency: varchar("frequency").default("immediate"),
  categories: jsonb("categories"),
  quiet_hours: jsonb("quiet_hours"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const pushTokens = pgTable("push_tokens", {
  id: varchar("id").primaryKey(),
  user_id: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  device_token: text("device_token"),
  platform: platformEnum("platform"),
  device_id: text("device_id"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey(),
  user_id: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  token_hash: text("token_hash"),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(userPreferences),
  push_tokens: many(pushTokens),
  refresh_tokens: many(refreshTokens),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;