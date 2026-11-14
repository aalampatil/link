import { useEffect, useState } from "react";
import axiosApi from "@/config/axiosApi";
import SettingsSection from "./SettingsSection";

type Analytics = { visits: { total: number; waiting: number; ready: number; paused: number; lastOpened: string | null }; daily: { date: string; total: number }[]; subscribers: { confirmed: number; notified: number }; deliveries: { failed: number; pending: number } };
export default function AnalyticsPanel({ slug }: { slug: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    axiosApi.get(`/link/${slug}/analytics`, { signal: controller.signal }).then(r => setData(r.data)).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [slug]);
  return <SettingsSection title="Visits & notifications" description="Visits are approximate 30-minute browser sessions. No IP addresses, tracking cookies, or referrers are stored.">
    {error ? <p role="alert">Could not load analytics. Switch tabs to try again.</p> : !data ? <p role="status">Loading analytics…</p> : <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-5">{[["Total visits", data.visits.total], ["Before ready", data.visits.waiting], ["When ready", data.visits.ready], ["While paused", data.visits.paused], ["Confirmed subscribers", data.subscribers.confirmed], ["Subscribers notified", data.subscribers.notified]].map(([label, value]) => <div key={label}><dt className="text-xs">{label}</dt><dd className="mt-1 text-2xl">{value}</dd></div>)}</dl>
      <p className="text-sm">Last opened: {data.visits.lastOpened ? new Date(data.visits.lastOpened).toLocaleString() : "No visits yet"}</p>
      <div><h3 className="mb-3 text-sm">Visits over the last 14 days (UTC)</h3>{!data.daily.length ? <p className="text-sm">Visit activity will appear here.</p> : <ol className="space-y-3">{data.daily.map(day => <li key={day.date} className="grid grid-cols-[90px_1fr_25px] items-center gap-3 text-xs"><time>{day.date}</time><span className="h-2 rounded bg-main" style={{ width: `${Math.max(2, day.total / Math.max(...data.daily.map(d => d.total)) * 100)}%` }} /><span>{day.total}</span></li>)}</ol>}</div>
      <p className="border-t pt-4 text-xs">Email queue: {data.deliveries.pending} pending · {data.deliveries.failed} failed after retries. Failed delivery requires the site administrator to check SMTP settings.</p>
    </div>}
  </SettingsSection>;
}
