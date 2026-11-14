ALTER TABLE "links" ADD COLUMN "health_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "health_email" varchar(320);--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "health_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "health_next_check_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "health_results" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "health_failures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "health_incident_id" uuid;