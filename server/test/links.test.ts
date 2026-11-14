import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, ownerHeaders, testApp } from "./helpers.js";
import { linksTable } from "../src/db/schema.js";
import { enqueueReminders } from "../src/jobs/reminders.js";
import { processMailJobs } from "../src/jobs/mail.js";
import { mailJobs } from "../src/db/schema.js";
import { publishScheduled } from "../src/jobs/publishing.js";
import { enqueueReadyNotifications } from "../src/jobs/notifications.js";
import { randomUUID } from "node:crypto";
let app: Awaited<ReturnType<typeof testApp>>;
let slug: string;
before(async () => {
  app = await testApp();
  const response = await fetch(`${app.url}/create`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ displayTitle: "Expiry test" }) });
  assert.equal(response.status, 201);
  slug = (await response.json()).slug;
});
after(async () => {
  if (slug) await db.delete(linksTable).where(eq(linksTable.slug, slug));
  await app?.close();
  await db.$client.end();
});
test("expired links remain owner-manageable and can be renewed", async () => {
  await db.update(linksTable).set({ linkValidity: new Date(Date.now() - 1000) }).where(eq(linksTable.slug, slug));
  assert.equal((await fetch(`${app.url}/public/${slug}`)).status, 410);
  assert.equal((await fetch(`${app.url}/manage/${slug}`, { headers: ownerHeaders() })).status, 200);
  const renewed = await fetch(`${app.url}/${slug}/expiry`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ days: 7 }) });
  assert.equal(renewed.status, 200);
  assert.ok(new Date((await renewed.json()).linkValidity).getTime() > Date.now() + 6 * 86_400_000);
  assert.equal((await fetch(`${app.url}/public/${slug}`)).status, 200);
});
test("renewal rejects invalid input and other owners", async () => {
  for (const days of [0, 366, 1.5, "30"]) {
    assert.equal((await fetch(`${app.url}/${slug}/expiry`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ days }) })).status, 400);
  }
  assert.equal((await fetch(`${app.url}/${slug}/expiry`, { method: "POST", headers: ownerHeaders("another-owner"), body: JSON.stringify({ days: 7 }) })).status, 404);
});

test("holding settings are validated, owner-scoped, and visible publicly", async () => {
  const body = { displayTitle: "Updated project", holdingMessage: "Preparing the demo", expectedAt: "2027-02-01T10:00:00+05:30", progress: 65 };
  assert.equal((await fetch(`${app.url}/${slug}/holding`, { method: "PUT", headers: ownerHeaders("other"), body: JSON.stringify(body) })).status, 404);
  assert.equal((await fetch(`${app.url}/${slug}/holding`, { method: "PUT", headers: ownerHeaders(), body: JSON.stringify({ ...body, progress: 101 }) })).status, 400);
  assert.equal((await fetch(`${app.url}/${slug}/holding`, { method: "PUT", headers: ownerHeaders(), body: JSON.stringify(body) })).status, 200);
  const result = await (await fetch(`${app.url}/public/${slug}`)).json();
  assert.equal(result.holdingMessage, body.holdingMessage);
  assert.equal(result.progress, 65);
  assert.equal(result.ownerId, undefined);
});

test("pause hides the destination and resume restores it without changing the public URL", async () => {
  const target = "https://example.com/finished";
  await fetch(`${app.url}/${slug}/map`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ contentType: "Post", targetUrl: target }) });
  assert.equal((await (await fetch(`${app.url}/public/${slug}`)).json()).mappedUrl, target);
  assert.equal((await fetch(`${app.url}/${slug}/pause`, { method: "PUT", headers: ownerHeaders("other"), body: JSON.stringify({ paused: true }) })).status, 404);
  await fetch(`${app.url}/${slug}/pause`, { method: "PUT", headers: ownerHeaders(), body: JSON.stringify({ paused: true }) });
  const paused = await (await fetch(`${app.url}/public/${slug}`)).json();
  assert.equal(paused.status, "paused");
  assert.equal(paused.mappedUrl, null);
  await fetch(`${app.url}/${slug}/pause`, { method: "PUT", headers: ownerHeaders(), body: JSON.stringify({ paused: false }) });
  assert.equal((await (await fetch(`${app.url}/public/${slug}`)).json()).mappedUrl, target);
});

test("history preserves previous destinations and restores only a version owned by this link", async () => {
  await fetch(`${app.url}/${slug}/map`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ contentType: "Post", targetUrl: "https://example.com/revision-2" }) });
  const response = await fetch(`${app.url}/${slug}/history`, { headers: ownerHeaders() });
  const { versions } = await response.json();
  assert.ok(versions.length >= 1);
  assert.equal(versions[0].destination.mappedUrl, "https://example.com/finished");
  assert.equal((await fetch(`${app.url}/${slug}/history`, { headers: ownerHeaders("other") })).status, 404);
  assert.equal((await fetch(`${app.url}/${slug}/restore`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ versionId: "bad" }) })).status, 400);
  const restored = await fetch(`${app.url}/${slug}/restore`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ versionId: versions[0].id }) });
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).mappedUrl, "https://example.com/finished");
});

test("activity records changes atomically and remains owner-only", async () => {
  const result = await (await fetch(`${app.url}/${slug}/activity`, { headers: ownerHeaders() })).json();
  assert.ok(result.events.some((event: { message: string }) => event.message === "Destination restored"));
  assert.ok(result.events.some((event: { message: string }) => event.message === "Link paused"));
  assert.equal((await fetch(`${app.url}/${slug}/activity`, { headers: ownerHeaders("other") })).status, 404);
});

test("deadline preferences are owner-scoped and accept local-time offsets", async () => {
  const body = { deadlineAt: "2027-01-01T12:00:00+05:30", reminderHours: 24, remindersEnabled: false };
  const result = await fetch(`${app.url}/${slug}/deadline`, { method: "PUT", headers: ownerHeaders(), body: JSON.stringify(body) });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).deadlineAt, "2027-01-01T06:30:00.000Z");
  assert.equal((await fetch(`${app.url}/${slug}/deadline`, { method: "PUT", headers: ownerHeaders("other"), body: JSON.stringify(body) })).status, 404);
});

test("reminders deduplicate, retry delivery failures, and cancel stale jobs", async () => {
  const now = new Date();
  await db.update(linksTable).set({ mappedUrl: null, deadlineAt: new Date(now.getTime() + 3600000), reminderHours: 24, remindersEnabled: true, reminderEmail: "owner@example.test", linkValidity: new Date(now.getTime() + 2 * 86400000) }).where(eq(linksTable.slug, slug));
  const [link] = await db.select().from(linksTable).where(eq(linksTable.slug, slug));
  await enqueueReminders(now); await enqueueReminders(now);
  assert.equal((await db.select().from(mailJobs).where(eq(mailJobs.linkId, link!.id))).length, 2);
  await processMailJobs(async () => { throw new Error("SMTP offline"); }, now);
  const queued = await db.select().from(mailJobs).where(eq(mailJobs.linkId, link!.id));
  assert.ok(queued.every(job => job.attempts === 1 && !job.sentAt));
  const delivered: string[] = [];
  await processMailJobs(async mail => { delivered.push(mail.subject); }, new Date(now.getTime() + 120000));
  assert.equal(delivered.length, 2);
  await enqueueReminders(now); await processMailJobs(async mail => { delivered.push(mail.subject); }, new Date(now.getTime() + 120000));
  assert.equal(delivered.length, 2);
  await db.update(linksTable).set({ deadlineAt: new Date(now.getTime() + 7200000) }).where(eq(linksTable.slug, slug));
  await enqueueReminders(now);
  await db.update(linksTable).set({ mappedUrl: "https://example.com/finished" }).where(eq(linksTable.slug, slug));
  await processMailJobs(async mail => { delivered.push(mail.subject); }, new Date(now.getTime() + 120000));
  assert.equal(delivered.length, 2);
});

test("scheduled destinations stay private, publish once when due, and can be cancelled", async () => {
  const scheduledAt = new Date(Date.now() + 3600000);
  const targetUrl = "https://example.com/private-draft";
  const result = await fetch(`${app.url}/${slug}/map`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ contentType: "Post", targetUrl, scheduledAt: scheduledAt.toISOString() }) });
  assert.equal(result.status, 200);
  const holding = await (await fetch(`${app.url}/public/${slug}`)).json();
  assert.equal(holding.mappedUrl, "https://example.com/finished");
  assert.equal(holding.scheduledDestination, undefined);
  assert.equal(await publishScheduled(new Date()), 0);
  assert.equal(await publishScheduled(new Date(scheduledAt.getTime() + 1)), 1);
  assert.equal(await publishScheduled(new Date(scheduledAt.getTime() + 1)), 0);
  assert.equal((await (await fetch(`${app.url}/public/${slug}`)).json()).mappedUrl, targetUrl);
  await fetch(`${app.url}/${slug}/map`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ contentType: "Post", targetUrl: "https://example.com/cancelled", scheduledAt: scheduledAt.toISOString() }) });
  assert.equal((await fetch(`${app.url}/${slug}/schedule`, { method: "DELETE", headers: ownerHeaders("other") })).status, 404);
  assert.equal((await fetch(`${app.url}/${slug}/schedule`, { method: "DELETE", headers: ownerHeaders() })).status, 200);
  assert.equal(await publishScheduled(new Date(scheduledAt.getTime() + 1)), 0);
});

test("visitor notifications require confirmation, send once, defer while paused, and support unsubscribe", async () => {
  const subscribeUrl = `${app.url}/public/${slug}/subscribe`;
  const body = { email: "visitor@example.test", consent: true, website: "" };
  assert.equal((await fetch(subscribeUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, consent: false }) })).status, 400);
  for (let i = 0; i < 2; i++) assert.equal((await fetch(subscribeUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).status, 202);
  const messages: { subject: string; body: string }[] = [];
  await processMailJobs(async mail => { messages.push(mail); }, new Date(Date.now() + 1000));
  const verification = messages.find(mail => mail.subject === "Confirm your project notification");
  assert.ok(verification);
  assert.equal(messages.filter(mail => mail.subject === "Confirm your project notification").length, 1);
  await enqueueReadyNotifications();
  assert.equal(messages.filter(mail => mail.subject.endsWith("is ready")).length, 0);
  const token = verification.body.match(/confirm\?token=([a-f0-9]{64})/)![1];
  const removal = verification.body.match(/unsubscribe\?token=([a-f0-9]{64})/)![1];
  const headers = { "Content-Type": "application/json" };
  const confirm = await fetch(`${app.url}/public/subscriptions/confirm`, { method: "POST", headers, body: JSON.stringify({ token }) });
  assert.equal(confirm.status, 200);
  await enqueueReadyNotifications();
  await fetch(`${app.url}/${slug}/pause`, { method: "PUT", headers: ownerHeaders(), body: JSON.stringify({ paused: true }) });
  await processMailJobs(async mail => { messages.push(mail); }, new Date(Date.now() + 1000));
  assert.equal(messages.filter(mail => mail.subject.endsWith("is ready")).length, 0);
  await fetch(`${app.url}/${slug}/pause`, { method: "PUT", headers: ownerHeaders(), body: JSON.stringify({ paused: false }) });
  await processMailJobs(async mail => { messages.push(mail); }, new Date(Date.now() + 120000));
  await enqueueReadyNotifications(); await processMailJobs(async mail => { messages.push(mail); }, new Date(Date.now() + 120000));
  assert.equal(messages.filter(mail => mail.subject.endsWith("is ready")).length, 1);
  assert.equal((await fetch(`${app.url}/public/subscriptions/unsubscribe`, { method: "POST", headers, body: JSON.stringify({ token: removal }) })).status, 200);
  const publicData = await (await fetch(`${app.url}/public/${slug}`)).json();
  assert.equal(publicData.reminderEmail, undefined);
  assert.equal(publicData.subscriptions, undefined);
});

test("visit analytics deduplicate sessions, distinguish phases, and stay owner-only", async () => {
  const visitKey = randomUUID();
  const record = (key: string) => fetch(`${app.url}/public/${slug}/visit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitKey: key }) });
  assert.equal((await record(visitKey)).status, 204);
  assert.equal((await record(visitKey)).status, 204);
  await fetch(`${app.url}/${slug}/pause`, { method: "PUT", headers: ownerHeaders(), body: JSON.stringify({ paused: true }) });
  await record(randomUUID());
  await db.update(linksTable).set({ paused: false, mappedUrl: null }).where(eq(linksTable.slug, slug));
  await record(randomUUID());
  const data = await (await fetch(`${app.url}/${slug}/analytics`, { headers: ownerHeaders() })).json();
  assert.equal(data.visits.total, 3);
  assert.equal(data.visits.ready, 1);
  assert.equal(data.visits.paused, 1);
  assert.equal(data.visits.waiting, 1);
  assert.ok(data.visits.lastOpened);
  assert.equal(data.daily[0].total, 3);
  assert.equal((await fetch(`${app.url}/${slug}/analytics`, { headers: ownerHeaders("other") })).status, 404);
  await db.update(linksTable).set({ mappedUrl: "https://example.com/finished" }).where(eq(linksTable.slug, slug));
});
