import {
  uuid,
  pgTable,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const contentTypeEnum = pgEnum("content_type_enum", ["Post", "File"]);

export const linksTable = pgTable("links", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  displayTitle: varchar("display_title", { length: 255 }).default(""),
  mappedUrl: varchar("mapped_url", { length: 2048 }),
  mappedOn: timestamp("mapped_on", { withTimezone: true }),
  publicUrl: varchar("public_url", { length: 2048 }).notNull(),
  manageUrl: varchar("manage_url", { length: 2048 }).notNull(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  status: varchar("status", { length: 10 }).generatedAlwaysAs(
    sql`CASE 
          WHEN mapped_url IS NOT NULL THEN 'ready' 
          ELSE 'pending' 
        END`,
  ),
  contentType: contentTypeEnum("content_type"), // post or file
  contentSubType: varchar("content_sub_type", { length: 40 }), // x, yt, linkedin, pdf, image, docx,
  fileSecureURL: varchar("file_secure_url", { length: 2048 }),
  filePublicId: varchar("file_public_id", { length: 2048 }),
  linkValidity: timestamp("link_validity").default(
    sql`now() + interval '30 days'`,
  ),
});
