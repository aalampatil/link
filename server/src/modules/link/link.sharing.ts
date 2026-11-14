import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { linksTable } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { validateUrl } from "../../utils/utils.js";
import { ownedLink } from "./link.repository.js";
import { parseBody } from "./link.validation.js";
import { assertActive } from "./link.policy.js";
import { recordActivity } from "./link.activity.js";

export async function updateSharing(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const input = parseBody(
    z
      .object({
        shareTitle: z.string().trim().max(120),
        shareDescription: z.string().trim().max(300),
        shareImageUrl: z.string().max(2048).nullable(),
      })
      .strict(),
    req.body,
  );
  if (input.shareImageUrl) {
    input.shareImageUrl = validateUrl(input.shareImageUrl);
    if (new URL(input.shareImageUrl).protocol !== "https:")
      throw ApiError.badRequest("Use an HTTPS thumbnail URL");
  }
  const result = await db.transaction(async (tx) => {
    const link = await ownedLink(String(req.params.slug), userId, tx, true);
    const [updated] = await tx
      .update(linksTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(linksTable.id, link.id))
      .returning();
    await recordActivity(tx, link.id, "Sharing preview updated");
    return updated;
  });
  res.json(result);
}

export async function getSharingPreview(req: Request, res: Response) {
  const [link] = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.slug, String(req.params.slug)));
  if (!link) throw ApiError.notfound();
  assertActive(link.linkValidity);
  res
    .set("Cache-Control", "no-store")
    .json({
      title: link.shareTitle || link.displayTitle || "A project on Link",
      description:
        link.shareDescription ||
        link.holdingMessage.slice(0, 300) ||
        "Follow this project on Link.",
      image: link.shareImageUrl,
      url: link.publicUrl,
    });
}
