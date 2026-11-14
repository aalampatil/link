import { Router } from "express";
import {
  createLink,
  getAllLinks,
  manageLink,
  mapLink,
  publicLink,
  deleteLink,
  extendExpiry,
} from "./link.controller.js";
import { requireAuth } from "@clerk/express";
import { upload } from "../../middlewares/upload.middleware.js";
import { updateHoldingPage, setPaused } from "./link.settings.js";
const linkRouter = Router();

linkRouter.post("/create", requireAuth(), createLink);
linkRouter.get("/public/:slug", publicLink);
linkRouter.get("/manage/:slug", requireAuth(), manageLink);
linkRouter.post("/:slug/map", requireAuth(), upload.single("file"), mapLink);
linkRouter.get("/get-all", requireAuth(), getAllLinks);
linkRouter.delete("/delete/:slug", requireAuth(), deleteLink);
linkRouter.post("/:slug/expiry", requireAuth(), extendExpiry);
linkRouter.put("/:slug/holding", requireAuth(), updateHoldingPage);
linkRouter.put("/:slug/pause", requireAuth(), setPaused);
export default linkRouter;
