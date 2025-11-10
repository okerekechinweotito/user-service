ALTER TABLE "user_preferences" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "language" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "email_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "push_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "email_frequency" integer DEFAULT 1440 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "push_frequency" integer DEFAULT 1440 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "channel";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "enabled";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "frequency";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "categories";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "quiet_hours";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "preferences";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id");