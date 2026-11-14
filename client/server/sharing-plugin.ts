import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { loadSharingPreview, renderSharingHtml } from "./share.js";

export function sharingPreviewPlugin(): Plugin {
  const middleware = (apiBase: string, templatePath: string, transform?: (url: string, html: string) => Promise<string>) => async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
    const match = new URL(req.url ?? "/", "http://localhost").pathname.match(/^\/l\/([a-zA-Z0-9_-]{1,100})\/?$/);
    if (req.method !== "GET" || !match?.[1]) { next(); return; }
    try {
      const template = await readFile(templatePath, "utf8");
      const html = transform ? await transform(req.url!, template) : template;
      const { preview, status } = await loadSharingPreview(apiBase, match[1]);
      res.statusCode = status;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(preview ? renderSharingHtml(html, preview) : html);
    } catch (error) { next(error); }
  };
  return {
    name: "link-sharing-previews",
    configureServer(server) { server.middlewares.use(middleware(server.config.env.VITE_SERVER ?? "", join(server.config.root, "index.html"), (url, html) => server.transformIndexHtml(url, html))); },
    configurePreviewServer(server) { server.middlewares.use(middleware(server.config.env.VITE_SERVER ?? "", join(server.config.root, server.config.build.outDir, "index.html"))); },
  };
}
