import { and, eq, isNotNull, isNull, gt, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptions, linksTable } from "../db/schema.js";
import { env } from "../env.js";
import { enqueueMail } from "./mail.js";
import { isExpired } from "../modules/link/link.policy.js";

export async function enqueueReadyNotifications(
  now = new Date(),
  signal?: AbortSignal,
) {
  let cursor: string | undefined;
  while (!signal?.aborted) {
    const rows = await db
      .select({ subscription: subscriptions, link: linksTable })
      .from(subscriptions)
      .innerJoin(linksTable, eq(subscriptions.linkId, linksTable.id))
      .where(
        and(
          isNotNull(subscriptions.verifiedAt),
          isNull(subscriptions.notifiedAt),
          isNotNull(linksTable.mappedUrl),
          eq(linksTable.paused, false),
          cursor ? gt(subscriptions.id, cursor) : undefined,
        ),
      )
      .orderBy(asc(subscriptions.id))
      .limit(200);
    for (const { subscription, link } of rows) {
      if (isExpired(link.linkValidity, now)) continue;
      await enqueueMail(db, {
        linkId: link.id,
        kind: "ready",
        reference: subscription.id,
        dedupeKey: `ready:${subscription.id}`,
        recipient: subscription.email,
        subject: `${link.displayTitle || "The project"} is ready`,
        body: `The work you followed is now available.\n\nOpen it: ${link.publicUrl}\n\nUnsubscribe: ${env.CLIENT}/notifications/unsubscribe?token=${subscription.unsubscribeToken}`,
        dueAt: now,
      });
    }
    if (rows.length < 200) break;
    cursor = rows.at(-1)!.subscription.id;
  }
}
