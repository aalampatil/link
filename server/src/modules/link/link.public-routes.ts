import { Router } from "express";
import rateLimit from "express-rate-limit";
import { publicLink } from "./link.controller.js";
import { subscribe, confirmSubscription, unsubscribe } from "./link.notifications.js";
import { recordVisit } from "./link.analytics.js";

export const publicRouter = Router();
const subscriptionLimit = rateLimit({ windowMs: 15 * 60000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { message: "Too many notification requests. Please try again later." } });
publicRouter.get("/public/:slug", publicLink);
publicRouter.post("/public/:slug/visit", rateLimit({ windowMs: 60000, limit: 120, standardHeaders: true, legacyHeaders: false }), recordVisit);
publicRouter.post("/public/:slug/subscribe", subscriptionLimit, subscribe);
publicRouter.post("/public/subscriptions/confirm", subscriptionLimit, confirmSubscription);
publicRouter.post("/public/subscriptions/unsubscribe", subscriptionLimit, unsubscribe);
