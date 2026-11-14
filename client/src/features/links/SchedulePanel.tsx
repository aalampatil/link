import { useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import type { LinkData } from "@/store/LinkStore";

export default function SchedulePanel({
  link,
  onUpdated,
}: {
  link: LinkData;
  onUpdated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const cancel = async () => {
    setBusy(true);
    try {
      await axiosApi.delete(`/link/${link.slug}/schedule`);
      await onUpdated();
      toast.success("Scheduled publication cancelled");
    } catch {
      toast.error("Could not cancel publication");
    } finally {
      setBusy(false);
    }
  };
  if (!link.scheduledAt) return null;
  return (
    <section className="panel space-y-3 p-6" aria-label="Scheduled publication">
      <h2 className="text-lg">Scheduled publication</h2>
      <p className="text-sm">{new Date(link.scheduledAt).toLocaleString()}</p>
      <p className="break-all text-xs">
        {link.scheduledDestination?.mappedUrl}
      </p>
      <p className="text-xs">
        The current public destination stays live until this time. A paused link
        stays paused. Publishing a new destination now replaces this schedule.
      </p>
      <Button variant="outline" disabled={busy} onClick={cancel}>
        {busy ? "Cancelling…" : "Cancel publication"}
      </Button>
    </section>
  );
}
