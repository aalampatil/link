import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { and, count, eq, gte, isNull, max, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { linksTable, linkVisits, subscriptions, mailJobs } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { assertActive } from "./link.policy.js";
import { ownedLink } from "./link.repository.js";
import { parseBody } from "./link.validation.js";

export async function recordVisit(req: Request, res: Response) {
  const { visitKey } = parseBody(z.object({ visitKey: z.uuid() }).strict(), req.body);
  await db.transaction(async tx => {
    const [link] = await tx.select().from(linksTable).where(eq(linksTable.slug, String(req.params.slug))).for("key share");
    if (!link) throw ApiError.notfound();
    assertActive(link.linkValidity);
    await tx.insert(linkVisits).values({ linkId: link.id, visitKey, phase: link.paused ? "paused" : link.mappedUrl ? "ready" : "pending" }).onConflictDoNothing();
  });
  res.status(204).end();
}

export async function getAnalytics(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const link = await ownedLink(String(req.params.slug), userId);
  const [visits, daily, audience, deliveries] = await Promise.all([
    db.select({ total: count(), waiting: sql<number>`count(*) filter (where ${linkVisits.phase} = 'pending')`.mapWith(Number), ready: sql<number>`count(*) filter (where ${linkVisits.phase} = 'ready')`.mapWith(Number), paused: sql<number>`count(*) filter (where ${linkVisits.phase} = 'paused')`.mapWith(Number), lastOpened: max(linkVisits.openedAt) }).from(linkVisits).where(eq(linkVisits.linkId, link.id)),
    db.select({ date: sql<string>`to_char(${linkVisits.openedAt} at time zone 'UTC', 'YYYY-MM-DD')`, total: count() }).from(linkVisits).where(and(eq(linkVisits.linkId, link.id), gte(linkVisits.openedAt, new Date(Date.now() - 14 * 86400000)))).groupBy(sql`to_char(${linkVisits.openedAt} at time zone 'UTC', 'YYYY-MM-DD')`).orderBy(sql`to_char(${linkVisits.openedAt} at time zone 'UTC', 'YYYY-MM-DD')`),
    db.select({ confirmed: sql<number>`count(*) filter (where ${subscriptions.verifiedAt} is not null)`.mapWith(Number), notified: sql<number>`count(*) filter (where ${subscriptions.notifiedAt} is not null)`.mapWith(Number) }).from(subscriptions).where(eq(subscriptions.linkId, link.id)),
    db.select({ failed: sql<number>`count(*) filter (where ${mailJobs.attempts} >= 5 and ${mailJobs.sentAt} is null and not ${mailJobs.cancelled})`.mapWith(Number), pending: sql<number>`count(*) filter (where ${mailJobs.attempts} < 5 and ${mailJobs.sentAt} is null and not ${mailJobs.cancelled})`.mapWith(Number) }).from(mailJobs).where(eq(mailJobs.linkId, link.id)),
  ]);
  res.set("Cache-Control", "no-store").json({ visits: visits[0], daily, subscribers: audience[0], deliveries: deliveries[0] });
}
