import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import SettingsSection from "./SettingsSection";

type Version = {
  id: string;
  destination: { mappedUrl: string; contentType: string };
  publishedAt: string | null;
  replacedAt: string;
};
export default function HistoryPanel({
  slug,
  onUpdated,
}: {
  slug: string;
  onUpdated: () => Promise<void>;
}) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    axiosApi
      .get(`/link/${slug}/history`, { signal: controller.signal })
      .then((r) => setVersions(r.data.versions))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [slug]);
  const restore = async (versionId: string) => {
    setBusy(true);
    try {
      await axiosApi.post(`/link/${slug}/restore`, { versionId });
      await onUpdated();
      toast.success("Previous destination restored");
    } catch {
      toast.error(
        "Could not restore this destination. Check the link has not expired.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SettingsSection
      title="Destination history"
      description="Restore a previous destination. Uploaded files are retained while this link exists."
    >
      {error ? (
        <p role="alert">Could not load history. Switch tabs to try again.</p>
      ) : !versions ? (
        <p role="status">Loading history…</p>
      ) : !versions.length ? (
        <p className="text-sm">
          Previous destinations will appear after you update your link.
        </p>
      ) : (
        <ol className="space-y-5">
          {versions.map((version) => (
            <li key={version.id} className="border-t pt-4">
              <p className="break-all text-sm">
                {version.destination.mappedUrl}
              </p>
              <p className="my-2 text-xs">
                Replaced {new Date(version.replacedAt).toLocaleString()}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => restore(version.id)}
              >
                Restore destination
              </Button>
            </li>
          ))}
        </ol>
      )}
    </SettingsSection>
  );
}
