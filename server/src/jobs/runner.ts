import { env } from "../env.js";
import { enqueueReminders } from "./reminders.js";
import { mailConfigured, processMailJobs } from "./mail.js";
import { publishScheduled } from "./publishing.js";

export async function runJobs(signal?: AbortSignal) {
  await publishScheduled(new Date(), signal);
  if (mailConfigured()) {
    await enqueueReminders(new Date(), signal);
    await processMailJobs(undefined, new Date(), signal);
  }
}
export function startJobRunner() {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> = Promise.resolve();
  const tick = () => {
    running = runJobs(controller.signal).catch(error => console.error("Background job cycle failed", error instanceof Error ? error.name : "Error")).finally(() => {
      if (!controller.signal.aborted) timer = setTimeout(tick, env.JOBS_INTERVAL_MS);
    });
  };
  tick();
  return async () => { controller.abort(); clearTimeout(timer); await running; };
}
