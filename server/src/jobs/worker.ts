import "dotenv/config";
import { startJobRunner } from "./runner.js";
import { db } from "../db/index.js";
const stop = startJobRunner();
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.once(signal, async () => {
    await stop();
    await db.$client.end();
  });
