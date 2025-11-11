-- Combined migration: drizzle/0000_init.sql

-- Types
CREATE TYPE "public"."channel" AS ENUM('email', 'push', 'sms');
CREATE TYPE "public"."platform" AS ENUM('ios', 'android', 'web');

-- Tables
CREATE TABLE "push_tokens" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"device_token" text,
	"platform" "platform",
	"device_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE "refresh_tokens" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"token_hash" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "user_preferences" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"language" varchar DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"email_frequency" integer DEFAULT 1440 NOT NULL,
	"push_frequency" integer DEFAULT 1440 NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"push_token" text,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"role" varchar(32) DEFAULT 'user' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Foreign Keys
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
