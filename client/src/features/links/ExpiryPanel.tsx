import { useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import type { LinkData } from "@/store/LinkStore";
import { expiryLabel } from "./presentation";

export default function ExpiryPanel({
  link,
  onUpdated,
}: {
  link: LinkData;
  onUpdated: () => Promise<void>;
}) {
  const [days, setDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const extend = async () => {
    setBusy(true);
    try {
      await axiosApi.post(`/link/${link.slug}/expiry`, { days: Number(days) });
      await onUpdated();
      toast.success("Link validity extended");
    } catch {
      toast.error("Could not extend this link. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="border-t border-border p-5" aria-label="Link expiry">
      <h3 className="text-sm">Link expiry</h3>
      <p className="my-3 text-sm" role="status">
        {expiryLabel(link.linkValidity)}
      </p>
      {link.linkValidity && (
        <p className="mb-4 text-xs">
          Expires {new Date(link.linkValidity).toLocaleString()}
        </p>
      )}
      <label htmlFor="extend-days" className="field-label">
        Extend by
      </label>
      <select
        id="extend-days"
        className="field mb-3"
        value={days}
        onChange={(e) => setDays(e.target.value)}
        disabled={busy}
      >
        <option value="7">7 days</option>
        <option value="30">30 days</option>
        <option value="90">90 days</option>
        <option value="365">365 days</option>
      </select>
      <Button type="button" className="w-full" disabled={busy} onClick={extend}>
        {busy ? "Extending…" : "Extend link"}
      </Button>
    </section>
  );
}
