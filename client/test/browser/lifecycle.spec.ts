import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const headers = { "x-test-owner": "browser-owner" };
let api: string;
let slug: string;
test.beforeEach(async ({ request }) => {
  api = JSON.parse(
    await readFile(new URL("../.browser-state.json", import.meta.url), "utf8"),
  ).api;
  const response = await request.post(`${api}/create`, {
    headers,
    data: { displayTitle: "Browser project" },
  });
  expect(response.status()).toBe(201);
  slug = (await response.json()).slug;
});
test.afterEach(async ({ request }) => {
  if (slug) await request.delete(`${api}/delete/${slug}`, { headers });
});

test("owner edits a holding page, renews, pauses, and sees it publicly", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/test/harness.html?slug=${slug}`);
  await page
    .getByRole("button", { name: "Project settings", exact: true })
    .click();
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Portfolio launch");
  await page.getByLabel("Project message").fill("Finishing the case studies.");
  await page.getByLabel("Progress (%)", { exact: true }).fill("75");
  await page.getByRole("button", { name: "Save holding page" }).click();
  await expect(
    page.getByRole("heading", { name: "Portfolio launch", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Extend by").selectOption("7");
  await page.getByRole("button", { name: "Extend link", exact: true }).click();
  await expect(page.getByText(/37 days? remaining/)).toBeVisible();
  await page.getByRole("button", { name: "Pause link", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume link", exact: true }),
  ).toBeVisible();
  const visitor = await context.newPage();
  await visitor.goto(`/test/harness.html?view=public&slug=${slug}`);
  await expect(
    visitor.getByRole("heading", { name: "Portfolio launch", exact: true }),
  ).toBeVisible();
  await expect(
    visitor.getByText("Temporarily paused", { exact: true }),
  ).toBeVisible();
  await expect(visitor.getByText("Finishing the case studies.")).toBeVisible();
  await visitor.getByLabel("Email address").fill("reader@example.test");
  await visitor.getByRole("checkbox").check();
  await visitor.getByRole("button", { name: "Notify me", exact: true }).click();
  await expect(visitor.getByRole("status")).toContainText("Check your inbox");
  await page.screenshot({
    path: testInfo.outputPath("settings-desktop.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("owner publishes a bundle, schedules a replacement, cancels it, and sees insights", async ({
  page,
  context,
  request,
}, testInfo) => {
  await page.goto(`/test/harness.html?slug=${slug}`);
  await page
    .getByRole("button", { name: "Resource bundle", exact: true })
    .click();
  await page.getByRole("button", { name: "Add resource", exact: true }).click();
  await page.getByLabel("Resource 1 label", { exact: true }).fill("Live demo");
  await page
    .getByLabel("Resource URL", { exact: true })
    .fill("https://example.com/demo");
  await page.getByRole("button", { name: "Add resource", exact: true }).click();
  await page
    .getByLabel("Resource 2 label", { exact: true })
    .fill("Presentation");
  await page
    .getByLabel("Resource URL", { exact: true })
    .nth(1)
    .fill("https://example.com/slides.pdf");
  await page
    .getByRole("button", { name: "Connect destination", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await (await request.get(`${api}/public/${slug}`)).json()).bundleItems
          .length,
    )
    .toBe(2);
  const visitor = await context.newPage();
  await visitor.goto(`/test/harness.html?view=public&slug=${slug}`);
  await expect(
    visitor.getByRole("link", { name: "Live demo", exact: true }),
  ).toHaveAttribute("href", "https://example.com/demo");
  await expect(
    visitor.getByRole("link", { name: "Presentation", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Website URL", exact: true }).click();
  await page
    .getByLabel("Destination URL", { exact: true })
    .fill("https://example.com/future");
  const future = new Date(Date.now() + 3600000);
  const localDate = new Date(
    future.getTime() - future.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  await page
    .getByLabel("Publish at (optional, your local time)", { exact: true })
    .fill(localDate);
  await page
    .getByRole("button", { name: "Schedule publication", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Scheduled publication", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel publication", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Scheduled publication", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Insights", exact: true }).click();
  await expect(page.getByText("Total visits", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "History & activity", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Project activity", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Destination connected", { exact: true }),
  ).toBeVisible();
  await visitor.setViewportSize({ width: 390, height: 844 });
  await visitor.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await visitor.screenshot({
    path: testInfo.outputPath("bundle-mobile-dark.png"),
    fullPage: true,
  });
  expect(
    await visitor.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("public link HTML contains custom sharing metadata before JavaScript runs", async ({
  request,
}) => {
  await request.put(`${api}/${slug}/sharing`, {
    headers,
    data: {
      shareTitle: "Portfolio preview",
      shareDescription: "Ready soon",
      shareImageUrl: "https://example.com/thumb.png",
    },
  });
  const response = await request.get(`/l/${slug}`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('property="og:title" content="Portfolio preview"');
  expect(html).toContain(
    'property="og:image" content="https://example.com/thumb.png"',
  );
  expect(html).toContain('id="root"');
});
