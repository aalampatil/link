import { useState } from "react";
import { toast } from "react-toastify";
import axiosApi from "@/config/axiosApi";
import { Button } from "@/components/ui/button";
import type { BundleItem } from "@/store/LinkStore";

export default function BundleEditor({
  slug,
  items,
  onChange,
  disabled,
  onUploadingChange,
}: {
  slug: string;
  items: BundleItem[];
  onChange: (items: BundleItem[]) => void;
  disabled: boolean;
  onUploadingChange: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const update = (id: string, changes: Partial<BundleItem>) =>
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  const upload = async (id: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Files must be 50 MB or smaller");
      return;
    }
    setUploading(id);
    onUploadingChange(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await axiosApi.post(`/link/${slug}/bundle-file`, form);
      update(id, { url: response.data.url });
      toast.success("File added to bundle draft");
    } catch {
      toast.error("Could not upload this file");
    } finally {
      setUploading(null);
      onUploadingChange(false);
    }
  };
  return (
    <fieldset disabled={disabled || uploading !== null} className="space-y-5">
      <legend className="mb-3 text-sm font-medium">
        Bundle resources (up to 12)
      </legend>
      {items.map((item, index) => (
        <div key={item.id} className="space-y-3 rounded-lg border p-4">
          <label className="field-label" htmlFor={`bundle-label-${item.id}`}>
            Resource {index + 1} label
          </label>
          <input
            id={`bundle-label-${item.id}`}
            className="field"
            value={item.label}
            required
            maxLength={120}
            onChange={(e) => update(item.id, { label: e.target.value })}
            placeholder="Demo, source code, presentation…"
          />
          <label className="field-label" htmlFor={`bundle-url-${item.id}`}>
            Resource URL
          </label>
          <input
            id={`bundle-url-${item.id}`}
            className="field"
            type="url"
            value={item.url}
            required
            maxLength={2048}
            onChange={(e) => update(item.id, { url: e.target.value })}
            placeholder="https://…"
          />
          <label className="field-label" htmlFor={`bundle-file-${item.id}`}>
            Or upload a supported file (up to 50 MB)
          </label>
          <input
            id={`bundle-file-${item.id}`}
            className="field text-xs"
            type="file"
            onChange={(e) => void upload(item.id, e.target.files?.[0])}
          />
          {uploading === item.id && (
            <p className="text-xs" role="status">
              Uploading file…
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                onChange(items.filter((entry) => entry.id !== item.id))
              }
            >
              Remove resource {index + 1}
            </Button>
            {index > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const reordered = [...items];
                  [reordered[index - 1], reordered[index]] = [
                    reordered[index],
                    reordered[index - 1],
                  ];
                  onChange(reordered);
                }}
              >
                Move up
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={items.length >= 12}
        onClick={() =>
          onChange([...items, { id: crypto.randomUUID(), label: "", url: "" }])
        }
      >
        Add resource
      </Button>
      {!items.length && (
        <p className="text-xs">Add at least one resource before publishing.</p>
      )}
    </fieldset>
  );
}
