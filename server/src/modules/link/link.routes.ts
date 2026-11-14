import { Router } from "express";
import {
  createLink,
  getAllLinks,
  manageLink,
  publicLink,
  deleteLink,
  extendExpiry,
} from "./link.controller.js";
import { requireAuth } from "@clerk/express";
import { upload } from "../../middlewares/upload.middleware.js";
import { updateHoldingPage, setPaused } from "./link.settings.js";
import { mapDestination, ensureWritableLink, getHistory, restoreDestination, uploadBundleFile } from "./link.destination.js";
import { getActivity } from "./link.activity.js";
import { updateDeadline } from "./link.deadline.js";
import { cancelSchedule } from "./link.schedule.js";
import { getAnalytics } from "./link.analytics.js";
import { updateSharing } from "./link.sharing.js";
const linkRouter = Router();

linkRouter.post("/create", requireAuth(), createLink);
linkRouter.get("/public/:slug", publicLink);
linkRouter.get("/manage/:slug", requireAuth(), manageLink);
linkRouter.post("/:slug/map", requireAuth(), ensureWritableLink, upload.single("file"), mapDestination);
linkRouter.post("/:slug/bundle-file", requireAuth(), ensureWritableLink, upload.single("file"), uploadBundleFile);
linkRouter.get("/:slug/history", requireAuth(), getHistory);
linkRouter.get("/:slug/activity", requireAuth(), getActivity);
linkRouter.get("/:slug/analytics", requireAuth(), getAnalytics);
linkRouter.put("/:slug/sharing", requireAuth(), updateSharing);
linkRouter.post("/:slug/restore", requireAuth(), restoreDestination);
linkRouter.get("/get-all", requireAuth(), getAllLinks);
linkRouter.delete("/delete/:slug", requireAuth(), deleteLink);
linkRouter.post("/:slug/expiry", requireAuth(), extendExpiry);
linkRouter.put("/:slug/holding", requireAuth(), updateHoldingPage);
linkRouter.put("/:slug/pause", requireAuth(), setPaused);
linkRouter.put("/:slug/deadline", requireAuth(), updateDeadline);
linkRouter.delete("/:slug/schedule", requireAuth(), cancelSchedule);
export default linkRouter;
