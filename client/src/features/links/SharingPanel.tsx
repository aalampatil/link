import { useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import type { LinkData } from "@/store/LinkStore";
import SettingsSection from "./SettingsSection";

export default function SharingPanel({
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
    setBusy(true);
    try {
      await axiosApi.put(`/link/${link.slug}/sharing`, {
        shareTitle: form.get("shareTitle"),
        shareDescription: form.get("shareDescription"),
        shareImageUrl: form.get("shareImageUrl") || null,
      });
      await onUpdated();
      toast.success("Sharing preview saved");
    } catch {
      toast.error("Could not save this preview. Use an HTTPS image address.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SettingsSection
      title="Sharing preview"
      description="Choose the title, description, and image for your public link’s sharing card. Social platforms may cache older previews."
    >
      <form className="space-y-5" onSubmit={submit}>
        <div>
          <label className="field-label" htmlFor="share-title">
            Sharing title (optional)
          </label>
          <input
            id="share-title"
            className="field"
            name="shareTitle"
            maxLength={120}
            defaultValue={link.shareTitle}
            placeholder={link.displayTitle || "Project name"}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="share-description">
            Sharing description (optional)
          </label>
          <textarea
            id="share-description"
            className="field"
            name="shareDescription"
            maxLength={300}
            rows={3}
            defaultValue={link.shareDescription}
            placeholder="Falls back to your holding-page message"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="share-image">
            Thumbnail URL (optional, HTTPS)
          </label>
          <input
            id="share-image"
            className="field"
            name="shareImageUrl"
            type="url"
            maxLength={2048}
            defaultValue={link.shareImageUrl ?? ""}
            placeholder="https://…/project-preview.png"
          />
        </div>
        {link.shareImageUrl && (
          <img
            className="max-h-48 w-full rounded-lg border object-cover"
            src={link.shareImageUrl}
            alt="Current sharing thumbnail"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        )}
        <Button disabled={busy}>
          {busy ? "Saving…" : "Save sharing preview"}
        </Button>
      </form>
    </SettingsSection>
  );
}
