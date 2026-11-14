import type { LinkRecord } from "./link.repository.js";
import { mailConfigured } from "../../jobs/mail.js";

export function publicView(link: LinkRecord) {
  return {
    slug: link.slug,
    status: link.paused ? "paused" : link.status,
    displayTitle: link.displayTitle,
    mappedUrl: link.paused ? null : link.mappedUrl,
    bundleItems: link.paused ? [] : link.bundleItems,
    mappedOn: link.paused ? null : link.mappedOn,
    holdingMessage: link.holdingMessage,
    expectedAt: link.expectedAt,
    progress: link.progress,
    notificationsAvailable: mailConfigured(),
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}
