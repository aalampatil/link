import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Link2,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { useGenerateLinkStore } from "@/store/LinkStore";
import { linkManageUrl, linkPublicUrl } from "@/lib/localUrls";
import { copyLink } from "@/lib/clipboard";

export default function GenerateLink() {
  const { displayTitle, data, loading, setDisplayTitle, createLink } =
    useGenerateLinkStore();
  const handleCreate = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await createLink()) toast.success("Your link is ready to share");
  };
  const publicUrl = data ? linkPublicUrl(data.slug, data.publicUrl) : "";
  return (
    <main className="workspace max-w-3xl">
      <Link to="/get-all" className="quiet-link inline-flex items-center gap-2">
        <ArrowLeft size={14} /> My links
      </Link>
      <div className="mb-9 mt-8">
        <p className="eyebrow text-muted-foreground">
          A place for your next project
        </p>
        <h1 className="mt-3 text-3xl font-medium sm:text-4xl">
          Start with a link.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Share it today. Connect your finished work when it’s ready.
        </p>
      </div>
      <form onSubmit={handleCreate} className="panel p-6 sm:p-8">
        <label htmlFor="project-name" className="field-label">
          Project name{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="project-name"
          placeholder="e.g. Design portfolio 2026"
          maxLength={120}
          value={displayTitle}
          onChange={(e) => setDisplayTitle(e.target.value)}
          disabled={loading}
          aria-describedby="name-hint"
        />
        <p
          id="name-hint"
          className="mt-2 text-xs leading-5 text-muted-foreground"
        >
          This name appears on your holding page while the work is in progress.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole size={13} /> Only you can manage the destination.
          </p>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create link"}
            <ArrowRight size={15} />
          </Button>
        </div>
      </form>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Links start with 30 days of validity and can be extended in settings.
        Connect a website, a supported file, or a bundle of project resources.
      </p>
      {data && (
        <section aria-live="polite" className="panel mt-8 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted px-6 py-4 text-sm font-medium">
            <Check size={16} /> Your link is ready
          </div>
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-medium">
              {data.displayTitle || "Untitled project"}
            </h2>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Copy this public URL and share it with your audience.
            </p>
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-3 sm:flex-row sm:items-center">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <Link2 size={14} className="shrink-0 text-muted-foreground" />
                <span
                  className="break-all font-mono text-xs"
                  data-testid="created-public-url"
                >
                  {publicUrl}
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyLink(publicUrl)}
              >
                <Copy size={13} /> Copy link
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to={`/manage/${encodeURIComponent(data.slug)}`}>
                  Connect your work <ArrowRight size={14} />
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <a
                  href={linkManageUrl(data.slug, data.manageUrl)}
                  onClick={(event) => {
                    event.preventDefault();
                    void copyLink(linkManageUrl(data.slug, data.manageUrl));
                  }}
                >
                  Copy management link
                </a>
              </Button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
