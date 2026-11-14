import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { db } from "../../db/index.js";
import ApiError from "../../utils/api-error.js";
import {
  validateUrl,
  detectPostSubType,
  detectFileSubType,
  FILE_MIME_TO_SUB_TYPE,
} from "../../utils/utils.js";
import { getAuth } from "@clerk/express";
import { linksTable } from "../../db/schema.js";
import { desc, eq } from "drizzle-orm";
import { env } from "../../env.js";
import { z } from "zod";
import { assertActive as assertLinkIsActive, extendedValidity } from "./link.policy.js";
import { ownedLink } from "./link.repository.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../../utils/cloudinary.js";

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

    const { displayTitle } = req.body || {};
    const cleanTitle =
      typeof displayTitle === "string" ? displayTitle.trim().slice(0, 120) : "";
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
  res.json({
    slug: link.slug,
    status: link.status, // ✅ from computed column
    displayTitle: link.displayTitle,
    mappedUrl: link.mappedUrl ?? null,
    mappedOn: link.mappedOn,
    holdingMessage: link.holdingMessage,
    expectedAt: link.expectedAt,
    progress: link.progress,
  });
};

// MANAGE LINK (requires auth + ownership)
const manageLink = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();

  const { slug } = req.params;
  // console.log(slug);
  if (typeof slug !== "string") throw ApiError.badRequest();

  const link = await ownedLink(slug, userId);
  res.set("Cache-Control", "no-store").json(link);
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
    return updated;
  });
  res.json(link);
};

//#region

const mapLink = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();

  const { slug } = req.params;
  const { targetUrl, contentType } = req.body || {};

  if (contentType !== "Post" && contentType !== "File") {
    throw ApiError.badRequest("contentType must be 'Post' or 'File'");
  }

  const [link] = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.slug, slug as string));

  if (!link) throw ApiError.notfound();
  assertLinkIsActive(link.linkValidity);
  if (link.ownerId !== userId) throw ApiError.forbidden("Not your link");

  //post
  if (contentType === "Post") {
    if (!slug || typeof targetUrl !== "string") {
      throw ApiError.badRequest();
    }
    const validUrl = validateUrl(targetUrl);
    const contentSubType = detectPostSubType(validUrl);

    const [link] = await db
      .update(linksTable)
      .set({
        mappedUrl: validUrl,
        mappedOn: new Date(),
        updatedAt: new Date(),
        contentType: "Post",
        contentSubType,
      })
      .where(eq(linksTable.slug, slug as string))
      .returning();

    if (!link) throw ApiError.notfound();
    if (link.ownerId !== userId) throw ApiError.forbidden("Not your link");

    return res.json({
      slug: link.slug,
      status: link.status, // auto from DB
      mappedUrl: link.mappedUrl,
      mappedOn: link.mappedOn,
    });
  }

  if (contentType === "File") {
    const file = req.file;
    if (!file)
      throw ApiError.badRequest("A file upload is required for File type");

    const ALLOWED_FILE_MIME_TYPES = Object.keys(FILE_MIME_TO_SUB_TYPE);

    if (!ALLOWED_FILE_MIME_TYPES.includes(file.mimetype)) {
      throw ApiError.badRequest(
        `Unsupported file type '${file.mimetype}'. Allowed: ${ALLOWED_FILE_MIME_TYPES.join(", ")}`,
      );
    }

    const contentSubType = detectFileSubType(file.mimetype);
    const cloudinaryResponse = await uploadOnCloudinary(file.path);

    if (!cloudinaryResponse) {
      throw ApiError.internalError("File upload to Cloudinary failed");
    }

    const [link] = await db
      .update(linksTable)
      .set({
        contentType: "File",
        contentSubType,
        mappedUrl: cloudinaryResponse.secure_url,
        fileSecureURL: cloudinaryResponse.secure_url,
        filePublicId: cloudinaryResponse.public_id,
        mappedOn: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(linksTable.slug, slug as string))
      .returning();

    if (!link) throw ApiError.internalError("failed to map link");

    return res.json({
      slug: link.slug,
      status: link.status, // auto from DB
      mappedUrl: link.mappedUrl,
      mappedOn: link.mappedOn,
    });
  }

  throw ApiError.badRequest("Unsupported content type");
};

//#endregion

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

  const { slug } = req.params;
  if (!slug) throw ApiError.badRequest("Missing slug");

  const [link] = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.slug, slug as string));

  if (!link) throw ApiError.notfound("Link not found");
  if (link.ownerId !== userId) throw ApiError.forbidden("Not your link");

  if (link.contentType === "File" && link.filePublicId) {
    await deleteFromCloudinary(link.filePublicId);
  }

  await db.delete(linksTable).where(eq(linksTable.slug, slug as string));

  return res.status(200).json({ message: "Link deleted" });
};

export { createLink, publicLink, manageLink, mapLink, getAllLinks, deleteLink };
