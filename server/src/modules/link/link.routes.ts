import { Router } from "express";
import {
  createLink,
  getAllLinks,
  manageLink,
  publicLink,
  deleteLink,
  extendExpiry,
} from "./link.controller.js";
import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import ApiError from "../../utils/api-error.js";
import { upload } from "../../middlewares/upload.middleware.js";
import { updateHoldingPage, setPaused } from "./link.settings.js";
import {
  mapDestination,
  ensureWritableLink,
  getHistory,
  restoreDestination,
  uploadBundleFile,
} from "./link.destination.js";
import { getActivity } from "./link.activity.js";
import { updateDeadline } from "./link.deadline.js";
import { cancelSchedule } from "./link.schedule.js";
import { getAnalytics } from "./link.analytics.js";
import { updateSharing } from "./link.sharing.js";
import { checkDestination, updateHealthSettings } from "./link.health.js";
const linkRouter = Router();
const requireOwner: RequestHandler = (req, _res, next) => {
  try {
    if (!getAuth(req).userId)
      throw ApiError.unauthorised("Sign in to manage your links");
    next();
  } catch (error) {
    next(error);
  }
};

linkRouter.post("/create", requireOwner, createLink);
linkRouter.get("/public/:slug", publicLink);
linkRouter.get("/manage/:slug", requireOwner, manageLink);
linkRouter.post(
  "/:slug/map",
  requireOwner,
  ensureWritableLink,
  upload.single("file"),
  mapDestination,
);
linkRouter.post(
  "/:slug/bundle-file",
  requireOwner,
  ensureWritableLink,
  upload.single("file"),
  uploadBundleFile,
);
linkRouter.get("/:slug/history", requireOwner, getHistory);
linkRouter.get("/:slug/activity", requireOwner, getActivity);
linkRouter.get("/:slug/analytics", requireOwner, getAnalytics);
linkRouter.put("/:slug/sharing", requireOwner, updateSharing);
linkRouter.post("/:slug/health/check", requireOwner, checkDestination);
linkRouter.put("/:slug/health", requireOwner, updateHealthSettings);
linkRouter.post("/:slug/restore", requireOwner, restoreDestination);
linkRouter.get("/get-all", requireOwner, getAllLinks);
linkRouter.delete("/delete/:slug", requireOwner, deleteLink);
linkRouter.post("/:slug/expiry", requireOwner, extendExpiry);
linkRouter.put("/:slug/holding", requireOwner, updateHoldingPage);
linkRouter.put("/:slug/pause", requireOwner, setPaused);
linkRouter.put("/:slug/deadline", requireOwner, updateDeadline);
linkRouter.delete("/:slug/schedule", requireOwner, cancelSchedule);
export default linkRouter;
