import { useEffect, useState } from "react";
import axiosApi from "@/config/axiosApi";
import SettingsSection from "./SettingsSection";

type Activity = { id: string; message: string; createdAt: string };
export default function ActivityPanel({ slug }: { slug: string }) {
  const [data, setData] = useState<{ events: Activity[]; createdAt: string } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    axiosApi.get(`/link/${slug}/activity`, { signal: controller.signal }).then(r => setData(r.data)).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [slug]);
  return <SettingsSection title="Project activity" description="A record of changes with their actual timestamps.">
    {error ? <p role="alert">Could not load activity. Switch tabs to try again.</p> : !data ? <p role="status">Loading activity…</p> : <ol className="space-y-4 border-l pl-5">
      {data.events.map(event => <li key={event.id}><p className="text-sm">{event.message}</p><time className="text-xs" dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time></li>)}
      <li><p className="text-sm">Placeholder created</p><time className="text-xs" dateTime={data.createdAt}>{new Date(data.createdAt).toLocaleString()}</time></li>
    </ol>}
  </SettingsSection>;
}
