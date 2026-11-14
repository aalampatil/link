import type { Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { linksTable } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { mailConfigured } from "../../jobs/mail.js";
import { ownedLink } from "./link.repository.js";
import { optionalDate, parseBody } from "./link.validation.js";
import { recordActivity } from "./link.activity.js";

export async function verifiedOwnerEmail(ownerId: string) {
  const user = await clerkClient.users.getUser(ownerId);
  const email = user.emailAddresses.find(
    (e) =>
      e.id === user.primaryEmailAddressId &&
      e.verification?.status === "verified",
  );
  if (!email)
    throw ApiError.badRequest(
      "Verify your primary account email before enabling email alerts",
    );
  return email.emailAddress;
}

export async function updateDeadline(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const input = parseBody(
    z
      .object({
        deadlineAt: optionalDate,
        reminderHours: z.number().int().min(1).max(168),
        remindersEnabled: z.boolean(),
      })
      .strict(),
    req.body,
  );
  await ownedLink(String(req.params.slug), userId);
  if (input.remindersEnabled && !mailConfigured())
    throw ApiError.badRequest(
      "Email delivery has not been configured by the site administrator",
    );
  const email = input.remindersEnabled
    ? await verifiedOwnerEmail(userId)
    : null;
  const updated = await db.transaction(async (tx) => {
    const link = await ownedLink(String(req.params.slug), userId, tx, true);
    const [result] = await tx
      .update(linksTable)
      .set({
        ...input,
        deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : null,
        reminderEmail: email,
        updatedAt: new Date(),
      })
      .where(eq(linksTable.id, link.id))
      .returning();
    await recordActivity(tx, link.id, "Deadline and email preferences updated");
    return result;
  });
  res.json(updated);
}
