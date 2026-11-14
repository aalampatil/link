ALTER TABLE "links" ADD COLUMN "share_title" varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "share_description" varchar(300) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "share_image_url" varchar(2048);