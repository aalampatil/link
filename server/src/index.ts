import "dotenv/config";
import { env } from "./env.js";
export const isProduction = env.NODE_ENV === "production";
import createApp from "./app.js";
import { startJobRunner } from "./jobs/runner.js";
import { db } from "./db/index.js";

const PORT = env.PORT ?? "5000";

if (!isProduction) {
  console.log("check 00");
}

async function main() {
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`link server listening on :${PORT} in ${env.NODE_ENV} mode`);
  });
  const stopJobs = env.JOBS_ENABLED === "true" ? startJobRunner() : async () => {};
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.once(signal, async () => {
    const closed = new Promise<void>(resolve => server.close(() => resolve()));
    await stopJobs();
    await closed;
    await db.$client.end();
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
