ALTER TABLE "links" ADD COLUMN "holding_message" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "expected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "progress" integer DEFAULT 0 NOT NULL;