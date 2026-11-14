import multer, { type StorageEngine } from "multer";
import { type Request } from "express";
import fs from "fs";
import path from "path";
import { FILE_MIME_TO_SUB_TYPE } from "../utils/utils.js";
import { randomUUID } from "node:crypto";
import ApiError from "../utils/api-error.js";

const uploadDir = path.join(process.cwd(), "public", "temp");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = Object.keys(FILE_MIME_TO_SUB_TYPE);

const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    cb(null, uploadDir);
  },

  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 12)}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`,
      ),
    );
  }
};

const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});
