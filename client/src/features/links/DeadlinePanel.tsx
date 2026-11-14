import { useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import type { LinkData } from "@/store/LinkStore";
import SettingsSection from "./SettingsSection";
import { dateInput } from "./presentation";

export default function DeadlinePanel({
  link,
  onUpdated,
}: {
  link: LinkData;
  onUpdated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("deadlineAt") ?? "");
    setBusy(true);
    try {
      await axiosApi.put(`/link/${link.slug}/deadline`, {
        deadlineAt: date ? new Date(date).toISOString() : null,
        reminderHours: Number(form.get("reminderHours")),
        remindersEnabled: form.get("remindersEnabled") === "on",
      });
      await onUpdated();
      toast.success("Deadline preferences saved");
    } catch {
      toast.error(
        "Could not save deadline preferences. Email alerts need a verified account email and configured delivery.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SettingsSection
      title="Deadline & reminders"
      description="Keep the submission deadline separate from link expiry. Email alerts go to your verified primary account email."
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="field-label" htmlFor="deadline-at">
            Submission deadline (your local time)
          </label>
          <input
            className="field"
            id="deadline-at"
            name="deadlineAt"
            type="datetime-local"
            defaultValue={dateInput(link.deadlineAt)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="reminder-hours">
            Remind me before the deadline
          </label>
          <select
            className="field"
            id="reminder-hours"
            name="reminderHours"
            defaultValue={link.reminderHours}
          >
            <option value={1}>1 hour</option>
            <option value={24}>1 day</option>
            <option value={48}>2 days</option>
            <option value={168}>1 week</option>
          </select>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="remindersEnabled"
            defaultChecked={link.remindersEnabled}
            disabled={!link.capabilities?.email}
          />
          Email me about missing submissions and links expiring within 3 days
        </label>
        {!link.capabilities?.email && (
          <p className="text-xs">
            Email alerts will be available once the site administrator connects
            email delivery. You can still save a deadline.
          </p>
        )}
        <Button disabled={busy}>
          {busy ? "Saving…" : "Save deadline preferences"}
        </Button>
      </form>
    </SettingsSection>
  );
}
