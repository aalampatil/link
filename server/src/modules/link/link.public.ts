import type { LinkRecord } from "./link.repository.js";

export function publicView(link: LinkRecord) {
  return {
    slug: link.slug,
    status: link.paused ? "paused" : link.status,
    displayTitle: link.displayTitle,
    mappedUrl: link.paused ? null : link.mappedUrl,
    mappedOn: link.paused ? null : link.mappedOn,
    holdingMessage: link.holdingMessage,
    expectedAt: link.expectedAt,
    progress: link.progress,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}
