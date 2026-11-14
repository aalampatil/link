import {
  uuid,
  pgTable,
  varchar,
  timestamp,
  pgEnum,
  text,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Destination } from "../modules/link/link.types.js";

export const contentTypeEnum = pgEnum("content_type_enum", ["Post", "File"]);

export const linksTable = pgTable("links", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  displayTitle: varchar("display_title", { length: 255 }).default(""),
  holdingMessage: text("holding_message").notNull().default(""),
  expectedAt: timestamp("expected_at", { withTimezone: true }),
  progress: integer("progress").notNull().default(0),
  paused: boolean("paused").notNull().default(false),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }),
  reminderHours: integer("reminder_hours").notNull().default(24),
  remindersEnabled: boolean("reminders_enabled").notNull().default(false),
  reminderEmail: varchar("reminder_email", { length: 320 }),
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
  fileResourceType: varchar("file_resource_type", { length: 10 }),
  linkValidity: timestamp("link_validity", { withTimezone: true }).default(
    sql`now() + interval '30 days'`,
  ),
});

export const destinationVersions = pgTable("destination_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id").notNull().references(() => linksTable.id, { onDelete: "cascade" }),
  destination: jsonb("destination").$type<Destination>().notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  replacedAt: timestamp("replaced_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [index("destination_versions_link_idx").on(table.linkId, table.replacedAt)]);

export const linkActivity = pgTable("link_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id").notNull().references(() => linksTable.id, { onDelete: "cascade" }),
  message: varchar("message", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [index("link_activity_link_idx").on(table.linkId, table.createdAt)]);

export const mailJobs = pgTable("mail_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id").notNull().references(() => linksTable.id, { onDelete: "cascade" }),
  dedupeKey: varchar("dedupe_key", { length: 512 }).notNull().unique(),
  kind: varchar("kind", { length: 20 }).notNull(),
  reference: text("reference").notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  cancelled: boolean("cancelled").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  lastError: varchar("last_error", { length: 255 }),
}, table => [index("mail_jobs_due_idx").on(table.dueAt)]);
