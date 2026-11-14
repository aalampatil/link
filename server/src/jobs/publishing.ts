import { and, asc, gt, isNotNull, lte, or, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { linksTable } from "../db/schema.js";
import { saveDestination } from "../modules/link/link.destination.js";

export async function publishScheduled(now = new Date(), signal?: AbortSignal) {
  let published = 0;
  for (let i = 0; i < 100 && !signal?.aborted; i++) {
    const found = await db.transaction(async tx => {
      const [link] = await tx.select().from(linksTable).where(and(isNotNull(linksTable.scheduledDestination), lte(linksTable.scheduledAt, now), or(isNull(linksTable.linkValidity), gt(linksTable.linkValidity, now)))).orderBy(asc(linksTable.scheduledAt)).limit(1).for("update", { skipLocked: true });
      if (!link?.scheduledDestination) return false;
      await saveDestination(tx, link, link.scheduledDestination, "Scheduled destination published");
      return true;
    });
    if (!found) break;
    published++;
  }
  return published;
}
