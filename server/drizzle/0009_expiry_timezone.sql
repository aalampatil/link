ALTER TABLE "links" ALTER COLUMN "link_validity" SET DATA TYPE timestamp with time zone USING "link_validity" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "links" ALTER COLUMN "link_validity" SET DEFAULT now() + interval '30 days';
