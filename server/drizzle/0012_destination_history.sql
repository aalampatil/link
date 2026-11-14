CREATE TABLE "destination_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"destination" jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"replaced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "file_resource_type" varchar(10);--> statement-breakpoint
ALTER TABLE "destination_versions" ADD CONSTRAINT "destination_versions_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "destination_versions_link_idx" ON "destination_versions" USING btree ("link_id","replaced_at");