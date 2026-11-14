import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { linksTable } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { ownedLink } from "./link.repository.js";
import { recordActivity } from "./link.activity.js";

export async function cancelSchedule(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const result = await db.transaction(async (tx) => {
    const link = await ownedLink(String(req.params.slug), userId, tx, true);
    const [updated] = await tx
      .update(linksTable)
      .set({
        scheduledAt: null,
        scheduledDestination: null,
        updatedAt: new Date(),
      })
      .where(eq(linksTable.id, link.id))
      .returning();
    if (link.scheduledAt)
      await recordActivity(tx, link.id, "Scheduled publication cancelled");
    return updated;
  });
  res.json(result);
}
