import crypto from "crypto";
import ApiError from "./api-error.js";

function hashKey(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generateMappingKey(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function validateUrl(raw: string): string {
  if (typeof raw !== "string") {
    throw ApiError.badRequest("targetUrl must be a string");
  }
  const value = raw.trim();
  if (!value) throw ApiError.badRequest("targetUrl is required");

  let url;
  try {
    url = new URL(value);
  } catch {
    throw ApiError.badRequest("targetUrl must be a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw ApiError.badRequest("targetUrl must be http(s)");
  }
  if (url.username || url.password) throw ApiError.badRequest("URLs must not contain credentials");

  return url.toString();
}

const POST_SUB_TYPE_PATTERN: Record<string, RegExp> = {
  x: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
  yt: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.+/i,
};

const FILE_MIME_TO_SUB_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "docx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/mkv": "video",
  "video/x-matroska": "video",
};

function detectPostSubType(url: string): string | null {
  for (const [subType, pattern] of Object.entries(POST_SUB_TYPE_PATTERN)) {
    if (pattern.test(url)) return subType;
  }
  return null;
}

function detectFileSubType(mimeType: string): string | null {
  return FILE_MIME_TO_SUB_TYPE[mimeType] ?? null;
}

export {
  hashKey,
  generateMappingKey,
  validateUrl,
  detectPostSubType,
  detectFileSubType,
  FILE_MIME_TO_SUB_TYPE,
};
