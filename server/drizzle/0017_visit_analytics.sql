CREATE TABLE "link_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"visit_key" uuid NOT NULL,
	"phase" varchar(10) NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "link_visits" ADD CONSTRAINT "link_visits_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "link_visits_session_idx" ON "link_visits" USING btree ("link_id","visit_key");--> statement-breakpoint
CREATE INDEX "link_visits_date_idx" ON "link_visits" USING btree ("link_id","opened_at");