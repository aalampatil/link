import { and, asc, eq, gt, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { linksTable } from "../db/schema.js";
import { checkLink } from "../modules/link/link.health.js";

export async function checkDueDestinations(now = new Date(), signal?: AbortSignal) {
  for (let i = 0; i < 20 && !signal?.aborted; i++) {
    const link = await db.transaction(async tx => {
      const [current] = await tx.select().from(linksTable).where(and(eq(linksTable.healthEnabled, true), eq(linksTable.paused, false), isNotNull(linksTable.mappedUrl), or(isNull(linksTable.linkValidity), gt(linksTable.linkValidity, now)), or(isNull(linksTable.healthNextCheckAt), lte(linksTable.healthNextCheckAt, now)))).orderBy(asc(linksTable.healthNextCheckAt)).limit(1).for("update", { skipLocked: true });
      if (current) await tx.update(linksTable).set({ healthNextCheckAt: new Date(now.getTime() + 5 * 60000) }).where(eq(linksTable.id, current.id));
      return current;
    });
    if (!link) break;
    try { await checkLink(link.id, signal ? { now, signal } : { now }); }
    catch { if (signal?.aborted) break; }
  }
}
