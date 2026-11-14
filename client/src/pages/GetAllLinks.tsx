import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useFetchLinksStore } from "@/store/LinkStore";
import axiosApi from "@/config/axiosApi";
import { linkPublicUrl } from "@/lib/localUrls";
import { copyLink } from "@/lib/clipboard";
import {
  expiryLabel,
  linkState,
  stateLabels,
} from "@/features/links/presentation";

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function GetAllLinks() {
  const { allLinks, loading, fetchAllLinks } = useFetchLinksStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      await fetchAllLinks();
      setError(false);
    } catch {
      setError(true);
    }
  }, [fetchAllLinks]);
  useEffect(() => {
    void load();
  }, [load]);
  const links = allLinks ?? [];
  const filtered = links.filter(
    (link) =>
      `${link.displayTitle} ${link.slug}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" || linkState(link) === filter),
  );
  const handleDelete = async (slug: string) => {
    if (
      !window.confirm(
        "Delete this link? People with the public URL will no longer be able to open it. This cannot be undone.",
      )
    )
      return;
    setDeleting(slug);
    try {
      await axiosApi.delete(`/link/delete/${slug}`);
      toast.success("Link deleted");
      await load();
    } catch {
      toast.error("Could not delete the link. Please try again.");
    } finally {
      setDeleting(null);
    }
  };
  return (
    <main className="workspace">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow text-muted-foreground">Your workspace</p>
          <h1 className="mt-3 text-3xl font-medium sm:text-4xl">My links</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A place for everything you’re working toward.
          </p>
        </div>
        <Button asChild>
          <Link to="/create-link">
            <Plus size={15} /> Create link
          </Link>
        </Button>
      </div>
      <div className="my-9 grid grid-cols-3 divide-x divide-border border-y border-border py-6">
        {[
          { label: "Total links", value: links.length },
          {
            label: "Connected",
            value: links.filter((l) => linkState(l) === "ready").length,
          },
          {
            label: "In progress",
            value: links.filter((l) => linkState(l) === "pending").length,
          },
        ].map((stat) => (
          <div key={stat.label} className="px-4 first:pl-0 sm:px-8">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-medium tracking-tight">
              {loading && !allLinks ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Filter links"
        >
          {[
            { value: "all", label: "All links" },
            { value: "ready", label: "Connected" },
            { value: "pending", label: "In progress" },
            { value: "paused", label: "Paused" },
            { value: "expired", label: "Expired" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              aria-pressed={filter === tab.value}
              className={`rounded-md px-3 py-2 text-xs font-medium ${filter === tab.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-60">
          <Search
            size={14}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            aria-label="Search links"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="field py-2.5 pl-9 text-xs"
          />
        </div>
      </div>
      {error ? (
        <div className="panel p-10 text-center" role="alert">
          <h2 className="text-lg">We couldn’t load your links.</h2>
          <p className="my-3 text-sm text-muted-foreground">
            Check your connection and try again.
          </p>
          <Button variant="outline" onClick={load}>
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-3" role="status" aria-label="Loading links">
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel h-40 animate-pulse bg-muted" />
          ))}
          <span className="sr-only">Loading your links</span>
        </div>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((link) => (
            <article
              key={link.id}
              className="panel p-5 transition-transform hover:-translate-y-px sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <Link2 size={17} className="text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-medium tracking-normal">
                      {link.displayTitle || "Untitled project"}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {formatDate(link.createdAt)}
                      {" · "}
                      {expiryLabel(link.linkValidity)}
                    </p>
                  </div>
                </div>
                <span
                  className={link.mappedUrl ? "status-ready" : "status-pending"}
                >
                  {link.mappedUrl ? (
                    <Check size={11} />
                  ) : (
                    <span className="size-1.5 rounded-full bg-foreground" />
                  )}
                  {stateLabels[linkState(link)]}
                </span>
              </div>
              <div className="my-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="break-all font-mono">/l/{link.slug}</span>
                <ArrowUpRight size={12} />
                <span className="min-w-0 truncate">
                  {link.mappedUrl || "No destination connected yet"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyLink(linkPublicUrl(link.slug, link.publicUrl))
                  }
                >
                  <Copy size={12} /> Copy link
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a
                    href={linkPublicUrl(link.slug, link.publicUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={12} /> Open
                    <span className="sr-only">
                      {" "}
                      {link.displayTitle || "project"} in a new tab
                    </span>
                  </a>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/manage/${encodeURIComponent(link.slug)}`}>
                    <Settings2 size={12} /> Manage
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-muted-foreground hover:bg-red-50 hover:text-red-700"
                  aria-label={`Delete ${link.displayTitle || "untitled project"}`}
                  disabled={deleting === link.slug}
                  onClick={() => handleDelete(link.slug)}
                >
                  <Trash2 size={13} />
                  {deleting === link.slug ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel flex flex-col items-center px-6 py-16 text-center">
          <span className="mb-5 flex size-12 items-center justify-center rounded-xl border border-border bg-muted">
            <Link2 size={20} className="text-muted-foreground" />
          </span>
          <h2 className="text-lg font-medium">
            {query || filter !== "all"
              ? "No matching links"
              : "Your next project starts here."}
          </h2>
          <p className="mb-6 mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
            {query || filter !== "all"
              ? "Try a different search or view all your links."
              : "Create a link now. Give your work a destination when it’s ready."}
          </p>
          {query || filter !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          ) : (
            <Button asChild>
              <Link to="/create-link">
                <Plus size={14} /> Create your first link
              </Link>
            </Button>
          )}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Links start with 30 days of validity. Extend or renew them from link
        settings.
      </p>
    </main>
  );
}
