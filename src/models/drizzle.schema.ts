import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const channelEnum = pgEnum("channel", ["email", "push", "sms"]);
export const platformEnum = pgEnum("platform", ["ios", "android", "web"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  push_token: text("push_token"),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  revoked_at: timestamp("revoked_at"),
});
export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey(),
  user_id: varchar("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  read: boolean("read").default(false).notNull(),
  write: boolean("write").default(false).notNull(),
  update: boolean("update").default(false).notNull(),
  delete: boolean("delete").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey(),
  user_id: varchar("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  email_enabled: boolean("email_enabled").default(true).notNull(),
  push_enabled: boolean("push_enabled").default(true).notNull(),
  language: varchar("language").default("en").notNull(),
  email_frequency: integer("email_frequency").default(1440).notNull(),
  push_frequency: integer("push_frequency").default(1440).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
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

export const usersRelations = relations(users, ({ many, one }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.user_id],
  }),
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