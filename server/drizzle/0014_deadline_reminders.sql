CREATE TABLE "mail_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"dedupe_key" varchar(512) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"reference" text NOT NULL,
	"recipient" varchar(320) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"cancelled" boolean DEFAULT false NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" varchar(255),
	CONSTRAINT "mail_jobs_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "reminder_hours" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "reminders_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "reminder_email" varchar(320);--> statement-breakpoint
ALTER TABLE "mail_jobs" ADD CONSTRAINT "mail_jobs_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_jobs_due_idx" ON "mail_jobs" USING btree ("due_at");