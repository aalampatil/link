import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { linksTable } from "../db/schema.js";
import { enqueueMail } from "./mail.js";
import { isExpired } from "../modules/link/link.policy.js";

export async function enqueueReminders(now = new Date(), signal?: AbortSignal) {
  let cursor: string | undefined;
  while (!signal?.aborted) {
    const links = await db
      .select()
      .from(linksTable)
      .where(
        and(
          eq(linksTable.remindersEnabled, true),
          cursor ? gt(linksTable.id, cursor) : undefined,
        ),
      )
      .orderBy(asc(linksTable.id))
      .limit(200);
    for (const link of links) {
      if (!link.reminderEmail || isExpired(link.linkValidity, now)) continue;
      const base = {
        linkId: link.id,
        recipient: link.reminderEmail,
        dueAt: now,
      };
      const title = link.displayTitle || "Your project";
      if (
        !link.mappedUrl &&
        link.deadlineAt &&
        link.deadlineAt.getTime() - link.reminderHours * 3600000 <=
          now.getTime()
      ) {
        const reference = link.deadlineAt.toISOString();
        await enqueueMail(db, {
          ...base,
          kind: "deadline",
          reference,
          dedupeKey: `deadline:${link.id}:${reference}`,
          subject: `${title}: submission reminder`,
          body: `Your deadline is ${link.deadlineAt.toUTCString()} and no destination is connected.\n\nManage your link: ${link.manageUrl}`,
        });
      }
      if (
        link.linkValidity &&
        link.linkValidity.getTime() - 3 * 86400000 <= now.getTime()
      ) {
        const reference = link.linkValidity.toISOString();
        await enqueueMail(db, {
          ...base,
          kind: "expiry",
          reference,
          dedupeKey: `expiry:${link.id}:${reference}`,
          subject: `${title}: link expires soon`,
          body: `Your public link expires ${link.linkValidity.toUTCString()}. Extend it in link settings.\n\n${link.manageUrl}`,
        });
      }
    }
    if (links.length < 200) break;
    cursor = links.at(-1)!.id;
  }
}
