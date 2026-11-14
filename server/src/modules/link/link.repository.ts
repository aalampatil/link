import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { linksTable } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";

export type LinkRecord = typeof linksTable.$inferSelect;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Database = typeof db | Transaction;

export async function ownedLink(slug: string, ownerId: string, executor: Database = db, lock = false) {
  const query = executor.select().from(linksTable).where(and(eq(linksTable.slug, slug), eq(linksTable.ownerId, ownerId)));
  const [link] = await (lock ? query.for("update") : query);
  if (!link) throw ApiError.notfound("Link not found");
  return link;
}
