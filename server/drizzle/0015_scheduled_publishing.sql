CREATE TABLE "link_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"public_id" varchar(2048) NOT NULL,
	"resource_type" varchar(10) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "scheduled_destination" jsonb;--> statement-breakpoint
ALTER TABLE "link_assets" ADD CONSTRAINT "link_assets_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_assets_link_idx" ON "link_assets" USING btree ("link_id");