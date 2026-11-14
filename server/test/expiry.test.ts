import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, ownerHeaders, testApp } from "./helpers.js";
import { linksTable } from "../src/db/schema.js";
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
