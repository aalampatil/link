import express, { type ErrorRequestHandler } from "express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";

const testUrl = process.env.TEST_DATABASE_URL ?? "postgresql://link_test:link_test@localhost:55434/link_test";
const parsed = new URL(testUrl);
if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) || !parsed.pathname.endsWith("_test")) {
  throw new Error("Integration tests require a local database with a name ending in _test");
}
Object.assign(process.env, {
  NODE_ENV: "test", DATABASE_URL: testUrl, CLIENT: "http://localhost:5173",
  CLERK_PUBLISHABLE_KEY: "pk_test_bG9jYWxob3N0JA==", CLERK_SECRET_KEY: "sk_test_placeholder",
  CLOUDINARY_CLOUD_NAME: "test", CLOUDINARY_API_KEY: "test", CLOUDINARY_API_SECRET: "test",
  SMTP_URL: "smtp://localhost:11025", MAIL_FROM: "Link <link@example.test>",
});
export const { db } = await import("../src/db/index.js");
const { default: router } = await import("../src/modules/link/link.routes.js");
const { publicRouter } = await import("../src/modules/link/link.public-routes.js");
export async function testApp() {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  const app = express();
  app.use(express.json());
  app.use("/api/link", publicRouter);
  app.use((req, _res, next) => {
    // Only this isolated test app accepts a synthetic identity. Production uses Clerk.
    Object.defineProperty(req, "auth", { value: () => ({ tokenType: "session_token", userId: req.headers["x-test-owner"] ?? null }) });
    next();
  });
  app.use("/api/link", router);
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    res.status(err.statusCode ?? 500).json({ message: err.message });
  };
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test address");
  return { url: `http://127.0.0.1:${address.port}/api/link`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}
export function ownerHeaders(owner = "test-owner") {
  return { "Content-Type": "application/json", "x-test-owner": owner };
}
