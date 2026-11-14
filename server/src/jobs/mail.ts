import nodemailer from "nodemailer";
import { and, eq, isNull, lte, lt, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { linksTable, mailJobs, subscriptions } from "../db/schema.js";
import { env } from "../env.js";
import { isExpired } from "../modules/link/link.policy.js";
import type { Database } from "../modules/link/link.repository.js";

export const mailConfigured = () => Boolean(env.SMTP_URL && env.MAIL_FROM);
const smtpUrl = env.SMTP_URL ? new URL(env.SMTP_URL) : null;
smtpUrl?.searchParams.set("connectionTimeout", "10000");
smtpUrl?.searchParams.set("socketTimeout", "10000");
const transport = smtpUrl
  ? nodemailer.createTransport(smtpUrl.toString(), { from: env.MAIL_FROM })
  : null;
export type Mail = {
  recipient: string;
  subject: string;
  body: string;
  id: string;
};
export async function sendMail(mail: Mail) {
  if (!transport || !env.MAIL_FROM)
    throw new Error("Email delivery is not configured");
  await transport.sendMail({
    to: mail.recipient,
    subject: mail.subject,
    text: mail.body,
    messageId: `<${mail.id}@link.notifications>`,
  });
}
export async function enqueueMail(
  executor: Database,
  job: typeof mailJobs.$inferInsert,
) {
  await executor
    .insert(mailJobs)
    .values(job)
    .onConflictDoNothing({ target: mailJobs.dedupeKey });
}

export async function processMailJobs(
  deliver = sendMail,
  now = new Date(),
  signal?: AbortSignal,
) {
  let processed = 0;
  for (let i = 0; i < 20 && !signal?.aborted; i++) {
    const found = await db.transaction(async (tx) => {
      const [job] = await tx
        .select()
        .from(mailJobs)
        .where(
          and(
            isNull(mailJobs.sentAt),
            eq(mailJobs.cancelled, false),
            lt(mailJobs.attempts, 5),
            lte(mailJobs.dueAt, now),
          ),
        )
        .orderBy(asc(mailJobs.dueAt))
        .limit(1)
        .for("update", { skipLocked: true });
      if (!job) return false;
      const [link] = await tx
        .select()
        .from(linksTable)
        .where(eq(linksTable.id, job.linkId));
      let valid = Boolean(
        link &&
        !isExpired(link.linkValidity, now) &&
        link.remindersEnabled &&
        link.reminderEmail === job.recipient &&
        (job.kind === "deadline"
          ? !link.mappedUrl && link.deadlineAt?.toISOString() === job.reference
          : job.kind === "expiry" &&
            link.linkValidity?.toISOString() === job.reference),
      );
      let subscriptionId: string | undefined;
      if (job.kind === "health")
        valid = Boolean(
          link &&
          !isExpired(link.linkValidity, now) &&
          link.healthEnabled &&
          link.healthEmail === job.recipient &&
          link.healthFailures >= 2 &&
          link.healthIncidentId === job.reference,
        );
      if (job.kind === "verify" || job.kind === "ready") {
        subscriptionId = job.reference.split(":")[0];
        const [subscription] = await tx
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.id, subscriptionId!),
              eq(subscriptions.linkId, job.linkId),
            ),
          )
          .for("update");
        valid = Boolean(
          link &&
          subscription &&
          subscription.email === job.recipient &&
          (job.kind === "verify"
            ? !subscription.verifiedAt &&
              subscription.verificationExpiresAt > now &&
              job.reference ===
                `${subscription.id}:${subscription.verificationHash}`
            : subscription.verifiedAt && !subscription.notifiedAt),
        );
        if (
          valid &&
          job.kind === "ready" &&
          link &&
          (link.paused || !link.mappedUrl || isExpired(link.linkValidity, now))
        ) {
          await tx
            .update(mailJobs)
            .set({ dueAt: new Date(now.getTime() + 60000) })
            .where(eq(mailJobs.id, job.id));
          return true;
        }
      }
      if (!valid) {
        await tx
          .update(mailJobs)
          .set({ cancelled: true })
          .where(eq(mailJobs.id, job.id));
        return true;
      }
      try {
        await deliver({
          id: job.id,
          recipient: job.recipient,
          subject: job.subject,
          body: job.body,
        });
        await tx
          .update(mailJobs)
          .set({ sentAt: now, attempts: job.attempts + 1, lastError: null })
          .where(eq(mailJobs.id, job.id));
        if (job.kind === "ready" && subscriptionId)
          await tx
            .update(subscriptions)
            .set({ notifiedAt: now })
            .where(eq(subscriptions.id, subscriptionId));
      } catch {
        await tx
          .update(mailJobs)
          .set({
            attempts: job.attempts + 1,
            lastError: "Delivery failed; check SMTP configuration",
            dueAt: new Date(
              now.getTime() + Math.min(3600000, 60000 * 2 ** job.attempts),
            ),
          })
          .where(eq(mailJobs.id, job.id));
      }
      return true;
    });
    if (!found) break;
    processed++;
  }
  return processed;
}
