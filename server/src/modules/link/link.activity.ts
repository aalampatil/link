import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { linkActivity } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { ownedLink, type Transaction } from "./link.repository.js";

export async function recordActivity(
  tx: Transaction,
  linkId: string,
  message: string,
) {
  await tx.insert(linkActivity).values({ linkId, message });
}

export async function getActivity(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const link = await ownedLink(String(req.params.slug), userId);
  const events = await db
    .select({
      id: linkActivity.id,
      message: linkActivity.message,
      createdAt: linkActivity.createdAt,
    })
    .from(linkActivity)
    .where(eq(linkActivity.linkId, link.id))
    .orderBy(desc(linkActivity.createdAt))
    .limit(100);
  res.json({ events, createdAt: link.createdAt, updatedAt: link.updatedAt });
}
