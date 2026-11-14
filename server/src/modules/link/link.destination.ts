import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import { z } from "zod";
import { db } from "../../db/index.js";
import { destinationVersions, linksTable, linkAssets } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";
import { validateUrl, detectPostSubType, detectFileSubType } from "../../utils/utils.js";
import { assertActive } from "./link.policy.js";
import { ownedLink, type LinkRecord, type Transaction } from "./link.repository.js";
import type { Destination } from "./link.types.js";
import { parseBody } from "./link.validation.js";
import { env } from "../../env.js";
import { randomUUID } from "node:crypto";
import { recordActivity } from "./link.activity.js";

export function snapshot(link: LinkRecord): Destination | null {
  if (!link.mappedUrl || !link.contentType) return null;
  const resource = link.fileResourceType ?? (link.fileSecureURL?.includes("/raw/") ? "raw" : link.fileSecureURL?.includes("/video/") ? "video" : "image");
  return { mappedUrl: link.mappedUrl, contentType: link.contentType, contentSubType: link.contentSubType,
    fileSecureURL: link.fileSecureURL, filePublicId: link.filePublicId, fileResourceType: resource as Destination["fileResourceType"], bundleItems: link.bundleItems };
}

export async function saveDestination(tx: Transaction, current: LinkRecord, destination: Destination, event?: string) {
  const previous = snapshot(current);
  if (previous) await tx.insert(destinationVersions).values({ linkId: current.id, destination: previous, publishedAt: current.mappedOn });
  const [updated] = await tx.update(linksTable).set({ ...destination, bundleItems: destination.bundleItems ?? [], scheduledAt: null, scheduledDestination: null, healthResults: [], healthCheckedAt: null, healthNextCheckAt: null, healthFailures: 0, healthIncidentId: null, mappedOn: new Date(), updatedAt: new Date() }).where(eq(linksTable.id, current.id)).returning();
  if (!updated) throw ApiError.notfound();
  await recordActivity(tx, current.id, event ?? (current.mappedUrl ? "Destination updated" : "Destination connected"));
  return updated;
}

export async function ensureWritableLink(req: Request, _res: Response, next: NextFunction) {
  try {
    const { userId } = getAuth(req);
    if (!userId) throw ApiError.unauthorised();
    const link = await ownedLink(String(req.params.slug), userId);
    assertActive(link.linkValidity);
    next();
  } catch (error) { next(error); }
}

export async function mapDestination(req: Request, res: Response) {
  let uploaded: Destination | null = null;
  let saved = false;
  try {
    const { userId } = getAuth(req);
    if (!userId) throw ApiError.unauthorised();
    let destination: Destination;
    const scheduledAt = req.body?.scheduledAt ? new Date(parseBody(z.iso.datetime({ offset: true }), req.body.scheduledAt)) : null;
    if (scheduledAt && scheduledAt.getTime() <= Date.now()) throw ApiError.badRequest("Choose a future publishing time");
    if (req.body?.contentType === "Bundle") {
      let raw = req.body.bundleItems;
      if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch { throw ApiError.badRequest("Invalid bundle items"); } }
      const items = parseBody(z.array(z.object({ id: z.uuid(), label: z.string().trim().min(1).max(120), url: z.string().max(2048).transform(validateUrl) }).strict()).min(1).max(12), raw);
      if (new Set(items.map(item => item.id)).size !== items.length) throw ApiError.badRequest("Bundle item IDs must be unique");
      destination = { mappedUrl: `${env.CLIENT}/l/${String(req.params.slug)}`, contentType: "Post", contentSubType: "bundle", fileSecureURL: null, filePublicId: null, fileResourceType: null, bundleItems: items };
    } else if (req.body?.contentType === "Post") {
      const input = parseBody(z.object({ targetUrl: z.string().max(2048) }), req.body);
      const url = validateUrl(input.targetUrl);
      destination = { mappedUrl: url, contentType: "Post", contentSubType: detectPostSubType(url), fileSecureURL: null, filePublicId: null, fileResourceType: null };
    } else if (req.body?.contentType === "File") {
      if (!req.file) throw ApiError.badRequest("Choose a file to upload");
      const result = await uploadOnCloudinary(req.file.path);
      if (!result) throw ApiError.internalError("File upload failed");
      destination = uploaded = { mappedUrl: result.secure_url, contentType: "File", contentSubType: detectFileSubType(req.file.mimetype), fileSecureURL: result.secure_url, filePublicId: result.public_id, fileResourceType: result.resource_type as Destination["fileResourceType"] };
    } else { throw ApiError.badRequest("Choose a website URL, file, or bundle"); }
    const updated = await db.transaction(async tx => {
      const current = await ownedLink(String(req.params.slug), userId, tx, true);
      assertActive(current.linkValidity);
      if (scheduledAt && current.linkValidity && scheduledAt >= current.linkValidity) throw ApiError.badRequest("Extend your link so it remains active at the publishing time");
      if (uploaded?.filePublicId) await tx.insert(linkAssets).values({ linkId: current.id, publicId: uploaded.filePublicId, resourceType: uploaded.fileResourceType ?? "image" });
      if (scheduledAt) {
        const [scheduled] = await tx.update(linksTable).set({ scheduledAt, scheduledDestination: destination, updatedAt: new Date() }).where(eq(linksTable.id, current.id)).returning();
        await recordActivity(tx, current.id, "Destination scheduled for publication");
        return scheduled;
      }
      return saveDestination(tx, current, destination);
    });
    saved = true;
    res.json(updated);
  } finally {
    if (req.file) await unlink(req.file.path).catch(() => {});
    if (uploaded?.filePublicId && !saved) await deleteFromCloudinary(uploaded.filePublicId, uploaded.fileResourceType ?? "image").catch(() => {});
  }
}

export async function uploadBundleFile(req: Request, res: Response) {
  let uploaded: { publicId: string; resourceType: "image" | "video" | "raw" } | null = null;
  let saved = false;
  try {
    const { userId } = getAuth(req);
    if (!userId) throw ApiError.unauthorised();
    if (!req.file) throw ApiError.badRequest("Choose a file");
    const result = await uploadOnCloudinary(req.file.path);
    if (!result) throw ApiError.internalError("File upload failed");
    uploaded = { publicId: result.public_id, resourceType: result.resource_type as "image" | "video" | "raw" };
    await db.transaction(async tx => {
      const link = await ownedLink(String(req.params.slug), userId, tx, true);
      assertActive(link.linkValidity);
      await tx.insert(linkAssets).values({ linkId: link.id, publicId: result.public_id, resourceType: result.resource_type });
    });
    saved = true;
    res.status(201).json({ id: randomUUID(), label: req.file.originalname.slice(0, 120), url: result.secure_url });
  } finally {
    if (req.file) await unlink(req.file.path).catch(() => {});
    if (uploaded && !saved) await deleteFromCloudinary(uploaded.publicId, uploaded.resourceType).catch(() => {});
  }
}

export async function getHistory(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const link = await ownedLink(String(req.params.slug), userId);
  const versions = await db.select().from(destinationVersions).where(eq(destinationVersions.linkId, link.id)).orderBy(desc(destinationVersions.replacedAt)).limit(100);
  res.json({ versions });
}

export async function restoreDestination(req: Request, res: Response) {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorised();
  const input = parseBody(z.object({ versionId: z.uuid() }).strict(), req.body);
  const updated = await db.transaction(async tx => {
    const current = await ownedLink(String(req.params.slug), userId, tx, true);
    assertActive(current.linkValidity);
    const [version] = await tx.select().from(destinationVersions).where(and(eq(destinationVersions.id, input.versionId), eq(destinationVersions.linkId, current.id)));
    if (!version) throw ApiError.notfound("Destination version not found");
    return saveDestination(tx, current, version.destination, "Destination restored");
  });
  res.json(updated);
}
