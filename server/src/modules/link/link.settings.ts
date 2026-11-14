import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { linksTable } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { ownedLink } from "./link.repository.js";
import { optionalDate, parseBody } from "./link.validation.js";

const holdingSchema = z.object({
  displayTitle: z.string().trim().min(1).max(120),
  holdingMessage: z.string().trim().max(2000),
  expectedAt: optionalDate,
  progress: z.number().int().min(0).max(100),
}).strict();

export async function updateHoldingPage(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const input = parseBody(holdingSchema, req.body);
  const updated = await db.transaction(async tx => {
    const current = await ownedLink(String(req.params.slug), userId, tx, true);
    const [link] = await tx.update(linksTable).set({
      ...input, expectedAt: input.expectedAt ? new Date(input.expectedAt) : null, updatedAt: new Date(),
    }).where(eq(linksTable.id, current.id)).returning();
    return link;
  });
  res.json(updated);
}

export async function setPaused(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const input = parseBody(z.object({ paused: z.boolean() }).strict(), req.body);
  const updated = await db.transaction(async tx => {
    const link = await ownedLink(String(req.params.slug), userId, tx, true);
    const [result] = await tx.update(linksTable).set({ paused: input.paused, updatedAt: new Date() }).where(eq(linksTable.id, link.id)).returning();
    return result;
  });
  res.json(updated);
}
