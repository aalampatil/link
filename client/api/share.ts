import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadSharingPreview, renderSharingHtml } from "../server/share.js";

// Serve the built app and metadata together: crawlers and browsers get the same URL.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? url.pathname.split("/").at(-1) ?? "";
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(slug)) return new Response("Link not found", { status: 404 });
  try {
    const template = await readFile(join(process.cwd(), "dist", "index.html"), "utf8");
    const { preview, status } = await loadSharingPreview(process.env.VITE_SERVER ?? "", slug);
    return new Response(preview ? renderSharingHtml(template, preview) : template, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    console.error("Could not load the public-link HTML template");
    return new Response("Link is temporarily unavailable. Please try again.", { status: 503 });
  }
}
