import type { Request, Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { linksTable, subscriptions } from "../../db/schema.js";
import { env } from "../../env.js";
import ApiError from "../../utils/api-error.js";
import { enqueueMail, mailConfigured } from "../../jobs/mail.js";
import { assertActive } from "./link.policy.js";
import { parseBody } from "./link.validation.js";

export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const acknowledgement = { message: "Check your inbox to confirm notifications. If you already subscribed, your preference is saved." };

export async function subscribe(req: Request, res: Response) {
  if (!mailConfigured()) throw ApiError.badRequest("Email notifications are currently unavailable");
  const input = parseBody(z.object({ email: z.email().max(320).transform(v => v.trim().toLowerCase()), consent: z.literal(true), website: z.string().max(255).optional() }).strict(), req.body);
  if (input.website) { res.status(202).json(acknowledgement); return; }
  await db.transaction(async tx => {
    const [link] = await tx.select().from(linksTable).where(eq(linksTable.slug, String(req.params.slug))).for("update");
    if (!link) throw ApiError.notfound("Link not found");
    assertActive(link.linkValidity);
    const [existing] = await tx.select().from(subscriptions).where(and(eq(subscriptions.linkId, link.id), eq(subscriptions.email, input.email)));
    if (existing && (existing.verifiedAt || existing.requestedAt.getTime() > Date.now() - 15 * 60000)) return;
    const verificationToken = randomBytes(32).toString("hex");
    const unsubscribeToken = randomBytes(32).toString("hex");
    const values = { linkId: link.id, email: input.email, verificationHash: tokenHash(verificationToken), verificationExpiresAt: new Date(Date.now() + 86400000), unsubscribeHash: tokenHash(unsubscribeToken), unsubscribeToken, requestedAt: new Date() };
    const [subscription] = existing ? await tx.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id)).returning() : await tx.insert(subscriptions).values(values).returning();
    if (!subscription) throw ApiError.internalError();
    await enqueueMail(tx, { linkId: link.id, kind: "verify", reference: `${subscription.id}:${values.verificationHash}`, dedupeKey: `verify:${subscription.id}:${values.verificationHash}`, recipient: input.email,
      subject: "Confirm your project notification", body: `Confirm you want one email when ${link.displayTitle || "this project"} is ready. This confirmation expires in 24 hours.\n\n${env.CLIENT}/notifications/confirm?token=${verificationToken}\n\nRemove this request: ${env.CLIENT}/notifications/unsubscribe?token=${unsubscribeToken}` });
  });
  res.status(202).json(acknowledgement);
}

export async function confirmSubscription(req: Request, res: Response) {
  const { token } = parseBody(tokenSchema, req.body);
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.verificationHash, tokenHash(token)));
  if (!subscription || subscription.verificationExpiresAt.getTime() <= Date.now()) throw ApiError.badRequest("This confirmation has expired. Subscribe again from the project page.");
  await db.update(subscriptions).set({ verifiedAt: new Date() }).where(and(eq(subscriptions.id, subscription.id), isNull(subscriptions.verifiedAt)));
  res.json({ message: "Confirmed. We will email you once when the project is ready." });
}

export async function unsubscribe(req: Request, res: Response) {
  const { token } = parseBody(tokenSchema, req.body);
  await db.delete(subscriptions).where(eq(subscriptions.unsubscribeHash, tokenHash(token)));
  res.json({ message: "Your notification request has been removed." });
}
