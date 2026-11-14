import { useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import type { LinkData } from "@/store/LinkStore";
import SettingsSection from "./SettingsSection";

export default function HealthPanel({
  link,
  onUpdated,
}: {
  link: LinkData;
  onUpdated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true);
    try {
      await axiosApi.post(`/link/${link.slug}/health/check`);
      await onUpdated();
      toast.success("Destination check complete");
    } catch {
      toast.error(
        "Could not check this link. Connect a destination and make sure the link has not expired.",
      );
    } finally {
      setBusy(false);
    }
  };
  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await axiosApi.put(`/link/${link.slug}/health`, {
        enabled: form.get("enabled") === "on",
        emailAlerts: form.get("emailAlerts") === "on",
      });
      await onUpdated();
      toast.success("Monitoring preferences saved");
    } catch {
      toast.error(
        "Could not save monitoring. Email alerts need a verified account email.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SettingsSection
      title="Destination health"
      description="Check your connected destination or bundle resources. Monitoring runs daily; email alerts require two consecutive failed checks."
    >
      <div className="space-y-5">
        <Button
          type="button"
          variant="outline"
          disabled={busy || !link.mappedUrl}
          onClick={check}
        >
          {busy ? "Working…" : "Check destinations now"}
        </Button>
        <p className="text-xs">
          Last checked:{" "}
          {link.healthCheckedAt
            ? new Date(link.healthCheckedAt).toLocaleString()
            : "Not checked yet"}
          . Manual checks are limited to once per minute.
        </p>
        <ul className="space-y-3">
          {link.healthResults.map((result) => (
            <li key={result.url} className="rounded-lg border p-3 text-xs">
              <p className="break-all">{result.url}</p>
              <p className="mt-2 font-medium">
                {result.status}
                {result.statusCode ? ` · HTTP ${result.statusCode}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-5">
          Some sites restrict automated checks or require sign-in. Restricted or
          unsupported checks do not trigger broken-destination alerts. Only
          public HTTP/HTTPS destinations on ports 80/443 are checked.
        </p>
        <form onSubmit={save} className="space-y-4 border-t pt-5">
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={link.healthEnabled}
            />
            Check destinations automatically each day
          </label>
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              name="emailAlerts"
              defaultChecked={!!link.healthEmail}
              disabled={!link.capabilities?.email}
            />
            Email my verified account address when a destination stays
            unavailable
          </label>
          <Button disabled={busy}>
            {busy ? "Saving…" : "Save monitoring preferences"}
          </Button>
        </form>
      </div>
    </SettingsSection>
  );
}
