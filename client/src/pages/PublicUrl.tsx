import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Link2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicLinkStore } from "@/store/LinkStore";

export default function PublicUrl() {
  const { slug } = useParams();
  const { isLoading, data, error, fetchLink } = usePublicLinkStore();
  useEffect(() => {
    if (slug) void fetchLink(slug);
  }, [slug, fetchLink]);
  return (
    <main className="page-container flex flex-1 items-center justify-center py-20 sm:py-28">
      <section className="w-full max-w-md text-center" aria-live="polite">
        <span className="mx-auto mb-7 flex size-14 items-center justify-center rounded-2xl border border-border bg-muted">
          {isLoading ? (
            <RefreshCw
              size={21}
              className="animate-spin text-muted-foreground"
            />
          ) : data ? (
            <Clock3
              size={23}
              strokeWidth={1.5}
              className="text-muted-foreground"
            />
          ) : (
            <Link2 size={23} className="text-muted-foreground" />
          )}
        </span>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {isLoading
            ? "Just a moment"
            : data
              ? "Work in progress"
              : "Link unavailable"}
        </p>
        <h1 className="text-3xl font-medium leading-tight">
          {isLoading
            ? "Opening your link…"
            : data
              ? data.displayTitle || "Something is taking shape."
              : "This link isn’t available."}
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          {isLoading
            ? "We’re checking the latest destination."
            : data
              ? "The owner has created a place for their work. Once it’s connected, this link will take you straight there."
              : error ||
                "It may have expired or been removed. Check the address with the person who shared it."}
        </p>
        {!isLoading && (
          <div className="mt-7">
            <Button variant="outline" onClick={() => slug && fetchLink(slug)}>
              <RefreshCw size={14} /> Check again
            </Button>
          </div>
        )}
        <div className="mt-12 border-t border-border pt-6">
          <Link to="/" className="quiet-link inline-flex items-center gap-2">
            {data ? (
              <>
                Create a link for your own work <ArrowUpRight size={13} />
              </>
            ) : (
              <>
                <ArrowLeft size={13} /> Back to Deadlink
              </>
            )}
          </Link>
        </div>
      </section>
    </main>
  );
}
