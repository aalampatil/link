CREATE TABLE "link_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"verification_hash" varchar(64) NOT NULL,
	"verification_expires_at" timestamp with time zone NOT NULL,
	"unsubscribe_hash" varchar(64) NOT NULL,
	"unsubscribe_token" varchar(64) NOT NULL,
	"verified_at" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "link_subscriptions" ADD CONSTRAINT "link_subscriptions_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_email_idx" ON "link_subscriptions" USING btree ("link_id","email");--> statement-breakpoint
CREATE INDEX "subscriptions_verified_idx" ON "link_subscriptions" USING btree ("link_id","verified_at");