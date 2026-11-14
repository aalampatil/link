import { useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import type { LinkData } from "@/store/LinkStore";
import SettingsSection from "./SettingsSection";
import { dateInput } from "./presentation";

export default function HoldingPanel({ link, onUpdated }: { link: LinkData; onUpdated: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const expected = String(form.get("expectedAt") ?? "");
    setBusy(true);
    try {
      await axiosApi.put(`/link/${link.slug}/holding`, {
        displayTitle: form.get("displayTitle"), holdingMessage: form.get("holdingMessage"),
        progress: Number(form.get("progress")), expectedAt: expected ? new Date(expected).toISOString() : null,
      });
      await onUpdated(); toast.success("Holding page updated");
    } catch { toast.error("Could not save your holding page"); }
    finally { setBusy(false); }
  };
  return <SettingsSection title="Holding page" description="Give visitors context while your work is in progress.">
    <form onSubmit={submit} className="space-y-5">
      <div><label className="field-label" htmlFor="holding-title">Project name</label><input className="field" id="holding-title" name="displayTitle" defaultValue={link.displayTitle} required maxLength={120} /></div>
      <div><label className="field-label" htmlFor="holding-message">Project message</label><textarea className="field" id="holding-message" name="holdingMessage" rows={4} defaultValue={link.holdingMessage} maxLength={2000} placeholder="Tell visitors what you’re working on…" /></div>
      <div><label className="field-label" htmlFor="expected-at">Expected availability (your local time)</label><input className="field" id="expected-at" name="expectedAt" type="datetime-local" defaultValue={dateInput(link.expectedAt)} /></div>
      <div><label className="field-label" htmlFor="project-progress">Progress (%)</label><input className="field" id="project-progress" name="progress" type="number" min={0} max={100} step={1} defaultValue={link.progress} required /></div>
      <Button disabled={busy}>{busy ? "Saving…" : "Save holding page"}</Button>
    </form>
  </SettingsSection>;
}
