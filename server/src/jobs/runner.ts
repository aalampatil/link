import { env } from "../env.js";
import { enqueueReminders } from "./reminders.js";
import { mailConfigured, processMailJobs } from "./mail.js";
import { publishScheduled } from "./publishing.js";
import { enqueueReadyNotifications } from "./notifications.js";
import { checkDueDestinations } from "./health.js";

export async function runJobs(signal?: AbortSignal) {
  await publishScheduled(new Date(), signal);
  if (mailConfigured()) {
    await enqueueReminders(new Date(), signal);
    await enqueueReadyNotifications(new Date(), signal);
    await processMailJobs(undefined, new Date(), signal);
  }
}
export function startJobRunner() {
  const controller = new AbortController();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const running = new Set<Promise<void>>();
  const tick = (task: () => Promise<unknown>) => {
    const active = task()
      .then(() => {})
      .catch((error) =>
        console.error(
          "Background job cycle failed",
          error instanceof Error ? error.name : "Error",
        ),
      )
      .finally(() => {
        running.delete(active);
        if (!controller.signal.aborted) {
          const timer = setTimeout(() => {
            timers.delete(timer);
            tick(task);
          }, env.JOBS_INTERVAL_MS);
          timers.add(timer);
        }
      });
    running.add(active);
  };
  // Slow remote checks run independently from publication and email delivery.
  tick(() => runJobs(controller.signal));
  tick(() => checkDueDestinations(new Date(), controller.signal));
  return async () => {
    controller.abort();
    timers.forEach(clearTimeout);
    await Promise.all(running);
  };
}
