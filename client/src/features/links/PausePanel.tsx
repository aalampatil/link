import { useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import type { LinkData } from "@/store/LinkStore";
import SettingsSection from "./SettingsSection";

export default function PausePanel({ link, onUpdated }: { link: LinkData; onUpdated: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      await axiosApi.put(`/link/${link.slug}/pause`, { paused: !link.paused });
      await onUpdated(); toast.success(link.paused ? "Link resumed" : "Link paused");
    } catch { toast.error("Could not change link availability"); }
    finally { setBusy(false); }
  };
  return <SettingsSection title="Availability" description={link.paused ? "Your link shows its holding page. The saved destination is kept for when you resume." : "Pause to show the holding page while you make changes. Your public URL stays the same."}>
    <Button type="button" variant="outline" disabled={busy} onClick={toggle}>{busy ? "Updating…" : link.paused ? "Resume link" : "Pause link"}</Button>
  </SettingsSection>;
}
