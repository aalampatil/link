import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  FileUp,
  Globe,
  Link2,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useManageLinkStore } from "@/store/LinkStore";
import { copyLink } from "@/lib/clipboard";
import { linkPublicUrl } from "@/lib/localUrls";
import ExpiryPanel from "@/features/links/ExpiryPanel";

export default function ManageUrlPage() {
  const {
    data,
    fetchLink,
    mapUrl,
    loading,
    fetching,
    targetUrl,
    setTargetUrl,
    file,
    setFile,
    contentType,
    setContentType,
  } = useManageLinkStore();
  const { slug } = useParams();
  useEffect(() => {
    if (slug) void fetchLink(slug);
  }, [slug, fetchLink]);
  const handleMap = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!slug || loading) return;
    if (contentType === "File" && !file) {
      toast.error("Please choose a file");
      return;
    }
    if (contentType === "Post" && !targetUrl.trim()) {
      toast.error("Please enter a destination URL");
      return;
    }
    if (await mapUrl(slug)) {
      form.reset();
      toast.success("Destination updated");
    }
  };
  const chooseType = (type: string) => {
    setContentType(type);
    setFile(null);
    setTargetUrl("");
  };
  const publicUrl = slug ? linkPublicUrl(slug) : "";
  return (
    <main className="workspace max-w-4xl">
      <Link to="/get-all" className="quiet-link inline-flex items-center gap-2">
        <ArrowLeft size={14} /> My links
      </Link>
      <div className="mb-9 mt-8">
        <p className="eyebrow text-muted-foreground">Link settings</p>
        <h1 className="mt-3 text-3xl font-medium sm:text-4xl">
          Connect your work.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Update the destination. Keep the link you’ve already shared.
        </p>
      </div>
      {fetching ? (
        <div className="panel p-10 text-sm text-muted-foreground" role="status">
          Loading link details…
        </div>
      ) : !data ? (
        <div className="panel p-8" role="alert">
          <h2 className="text-lg">This link is unavailable.</h2>
          <p className="mb-5 mt-2 text-sm leading-6 text-muted-foreground">
            It may have expired, been removed, or belong to a different account.
          </p>
          <Button variant="outline" onClick={() => slug && fetchLink(slug)}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[1fr_260px]">
          <form onSubmit={handleMap} className="panel p-6 sm:p-8">
            <h2 className="text-lg font-medium">Destination</h2>
            <p className="mb-6 mt-2 text-sm leading-6 text-muted-foreground">
              Choose where visitors go when they open your public link.
            </p>
            <div
              className="mb-6 grid grid-cols-2 gap-3"
              role="group"
              aria-label="Destination type"
            >
              {[
                { type: "Post", label: "Website URL", icon: Globe },
                { type: "File", label: "Upload a file", icon: FileUp },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => chooseType(type)}
                  aria-pressed={contentType === type}
                  disabled={loading}
                  className={`flex items-center gap-2 rounded-lg border p-4 text-sm transition-colors disabled:opacity-50 ${contentType === type ? "border-main bg-main text-main-foreground font-medium" : "border-border text-muted-foreground hover:border-main"}`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
            {contentType === "Post" ? (
              <div>
                <label htmlFor="destination-url" className="field-label">
                  Destination URL
                </label>
                <input
                  id="destination-url"
                  type="url"
                  required
                  placeholder="https://example.com/your-work"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  disabled={loading}
                  className="field"
                />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Use a full web address, including https://.
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="destination-file" className="field-label">
                  Choose your file
                </label>
                <input
                  id="destination-file"
                  type="file"
                  required
                  disabled={loading}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="field text-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:font-medium"
                />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Upload your finished document, image, or supported media file.
                </p>
              </div>
            )}
            <div className="mt-7 border-t border-border pt-6">
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving destination…"
                  : data.mappedUrl
                    ? "Update destination"
                    : "Connect destination"}
                <ArrowUpRight size={15} />
              </Button>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {data.mappedUrl
                  ? "This replaces the current destination for everyone with the link."
                  : "Your holding page will redirect visitors once connected."}
              </p>
            </div>
          </form>
          <aside className="panel overflow-hidden">
            <div className="border-b border-border bg-muted px-5 py-4">
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Link2 size={13} /> Link overview
              </div>
              <h2 className="break-words text-base font-medium">
                {data.displayTitle || "Untitled project"}
              </h2>
              <span
                className={`mt-3 ${data.mappedUrl ? "status-ready" : "status-pending"}`}
              >
                {data.mappedUrl ? (
                  <Check size={11} />
                ) : (
                  <span className="size-1.5 rounded-full bg-foreground" />
                )}
                {data.mappedUrl ? "Connected" : "In progress"}
              </span>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <h3 className="mb-2 text-xs font-medium tracking-normal">
                  Public link
                </h3>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-mono text-[11px] leading-5 text-muted-foreground hover:text-foreground"
                >
                  {publicUrl}
                </a>
              </div>
              {data.mappedUrl && (
                <div>
                  <h3 className="mb-2 text-xs font-medium tracking-normal">
                    Current destination
                  </h3>
                  <a
                    href={data.mappedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-xs leading-5 text-muted-foreground hover:text-foreground"
                  >
                    {data.mappedUrl}
                  </a>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => copyLink(publicUrl)}
              >
                <Copy size={12} /> Copy public link
              </Button>
            </div>
            <ExpiryPanel link={data} onUpdated={() => fetchLink(slug!)} />
          </aside>
        </div>
      )}
    </main>
  );
}
