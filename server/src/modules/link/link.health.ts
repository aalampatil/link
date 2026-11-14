import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { linksTable } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { probeUrl, type HealthResult } from "../../utils/public-http.js";
import { enqueueMail, mailConfigured } from "../../jobs/mail.js";
import { ownedLink } from "./link.repository.js";
import { assertActive } from "./link.policy.js";
import { verifiedOwnerEmail } from "./link.deadline.js";
import { parseBody } from "./link.validation.js";
import { recordActivity } from "./link.activity.js";

export async function checkLink(linkId: string, options: { probe?: typeof probeUrl; now?: Date; signal?: AbortSignal } = {}) {
  const now = options.now ?? new Date();
  const [original] = await db.select().from(linksTable).where(eq(linksTable.id, linkId));
  if (!original?.mappedUrl) throw ApiError.badRequest("Connect a destination before checking it");
  assertActive(original.linkValidity);
  const urls = original.bundleItems.length ? original.bundleItems.map(item => item.url) : [original.mappedUrl];
  const results: HealthResult[] = [];
  for (let i = 0; i < urls.length; i += 3) {
    options.signal?.throwIfAborted();
    results.push(...await Promise.all(urls.slice(i, i + 3).map(url => (options.probe ?? probeUrl)(url, options.signal ? { signal: options.signal } : {}))));
  }
  return db.transaction(async tx => {
    const [link] = await tx.select().from(linksTable).where(eq(linksTable.id, linkId)).for("update");
    if (!link) throw ApiError.notfound();
    if (link.mappedUrl !== original.mappedUrl || link.mappedOn?.getTime() !== original.mappedOn?.getTime()) return link;
    const failed = results.some(result => result.status === "unavailable");
    const healthFailures = failed ? link.healthFailures + 1 : 0;
    const incident = failed ? link.healthIncidentId ?? randomUUID() : null;
    const [updated] = await tx.update(linksTable).set({ healthResults: results, healthCheckedAt: now, healthNextCheckAt: new Date(now.getTime() + 24 * 3600000), healthFailures, healthIncidentId: incident }).where(eq(linksTable.id, link.id)).returning();
    if (link.healthEnabled && link.healthEmail && incident && healthFailures >= 2) await enqueueMail(tx, { linkId: link.id, kind: "health", reference: incident, dedupeKey: `health:${link.id}:${incident}`, recipient: link.healthEmail,
      subject: `${link.displayTitle || "Your project"}: destination may be unavailable`, body: `A destination failed two consecutive checks. Review your link's Insights tab.\n\n${link.manageUrl}`, dueAt: now });
    return updated;
  });
}

export async function checkDestination(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const link = await ownedLink(String(req.params.slug), userId);
  if (link.healthCheckedAt && link.healthCheckedAt.getTime() > Date.now() - 60000) { res.json(link); return; }
  res.json(await checkLink(link.id));
}

export async function updateHealthSettings(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const input = parseBody(z.object({ enabled: z.boolean(), emailAlerts: z.boolean() }).strict(), req.body);
  await ownedLink(String(req.params.slug), userId);
  if (input.emailAlerts && !mailConfigured()) throw ApiError.badRequest("Email delivery is not configured");
  const email = input.emailAlerts ? await verifiedOwnerEmail(userId) : null;
  const updated = await db.transaction(async tx => {
    const link = await ownedLink(String(req.params.slug), userId, tx, true);
    const [result] = await tx.update(linksTable).set({ healthEnabled: input.enabled, healthEmail: email, healthNextCheckAt: null, updatedAt: new Date() }).where(eq(linksTable.id, link.id)).returning();
    await recordActivity(tx, link.id, "Destination monitoring preferences updated");
    return result;
  });
  res.json(updated);
}
