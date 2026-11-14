import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { db } from "../../db/index.js";
import ApiError from "../../utils/api-error.js";
import { getAuth } from "@clerk/express";
import { linksTable, destinationVersions, linkAssets } from "../../db/schema.js";
import { desc, eq } from "drizzle-orm";
import { env } from "../../env.js";
import { z } from "zod";
import { assertActive as assertLinkIsActive, extendedValidity } from "./link.policy.js";
import { ownedLink } from "./link.repository.js";
import { publicView } from "./link.public.js";
import { snapshot } from "./link.destination.js";
import { recordActivity } from "./link.activity.js";
import { mailConfigured } from "../../jobs/mail.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";
import { parseBody } from "./link.validation.js";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const createSlug = (displayTitle: string) => {
  const baseSlug = slugify(displayTitle);
  return baseSlug ? `${baseSlug}-${nanoid(6)}` : nanoid(12);
};

const createLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) throw ApiError.unauthorised();

    const { displayTitle = "" } = parseBody(z.object({ displayTitle: z.string().trim().max(120).optional() }).strict(), req.body ?? {});
    const cleanTitle = displayTitle;
    const slug = createSlug(cleanTitle);

    const publicBaseUrl = env.CLIENT;

    const publicUrl = `${publicBaseUrl}/l/${slug}`;
    const manageUrl = `${publicBaseUrl}/manage/${encodeURIComponent(slug)}`;

    const [link] = await db
      .insert(linksTable)
      .values({
        slug,
        displayTitle: cleanTitle,
        ownerId: userId,
        publicUrl,
        manageUrl,
      })
      .returning();

    if (!link) throw ApiError.internalError("failed to create db");

    res.status(201).json({
      slug: link.slug,
      displayTitle: link.displayTitle,
      publicUrl: link.publicUrl,
      manageUrl: link.manageUrl,
    });
  } catch (error) {
    next(error);
  }
};

const publicLink = async (req: Request, res: Response) => {
  const { slug } = req.params;
  if (!slug) throw ApiError.badRequest();

  const [link] = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.slug, slug as string));

  if (!link) throw ApiError.notfound();
  assertLinkIsActive(link.linkValidity);

  res.set("Cache-Control", "no-store");
  res.json(publicView(link));
};

// MANAGE LINK (requires auth + ownership)
const manageLink = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();

  const { slug } = req.params;
  // console.log(slug);
  if (typeof slug !== "string") throw ApiError.badRequest();

  const link = await ownedLink(slug, userId);
  res.set("Cache-Control", "no-store").json({ ...link, capabilities: { email: mailConfigured() } });
};

export const extendExpiry = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const input = z.object({ days: z.number().int().min(1).max(365) }).safeParse(req.body);
  if (!input.success) throw ApiError.badRequest("Choose an extension between 1 and 365 days");
  const link = await db.transaction(async (tx) => {
    const current = await ownedLink(String(req.params.slug), userId, tx, true);
    const [updated] = await tx.update(linksTable).set({
      linkValidity: extendedValidity(current.linkValidity, input.data.days), updatedAt: new Date(),
    }).where(eq(linksTable.id, current.id)).returning();
    await recordActivity(tx, current.id, `Validity extended by ${input.data.days} days`);
    return updated;
  });
  res.json(link);
};

//#region

const getAllLinks = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();

  const links = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.ownerId, userId))
    .orderBy(desc(linksTable.createdAt))
    .limit(100);

  res.status(200).json({
    success: true,
    data: links,
  });
};

const deleteLink = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();

  await db.transaction(async tx => {
  const link = await ownedLink(String(req.params.slug), userId, tx, true);
  const versions = await tx.select().from(destinationVersions).where(eq(destinationVersions.linkId, link.id));
  const assets = new Map([snapshot(link), ...versions.map(v => v.destination)].filter(v => v?.filePublicId).map(v => [v!.filePublicId!, v!]));
  for (const asset of assets.values()) await deleteFromCloudinary(asset.filePublicId!, asset.fileResourceType ?? "image");
  const retained = await tx.select().from(linkAssets).where(eq(linkAssets.linkId, link.id));
  for (const asset of retained) if (!assets.has(asset.publicId)) await deleteFromCloudinary(asset.publicId, asset.resourceType as "image" | "video" | "raw");

  await tx.delete(linksTable).where(eq(linksTable.id, link.id));
  });

  return res.status(200).json({ message: "Link deleted" });
};

export { createLink, publicLink, manageLink, getAllLinks, deleteLink };
