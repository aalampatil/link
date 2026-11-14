export type SharingPreview = {
  title: string;
  description: string;
  image: string | null;
  url: string;
};
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

export function renderSharingHtml(template: string, preview: SharingPreview) {
  const title = escapeHtml(preview.title);
  const description = escapeHtml(preview.description);
  const url = escapeHtml(preview.url);
  const image =
    preview.image && /^https:\/\//.test(preview.image)
      ? `<meta property="og:image" content="${escapeHtml(preview.image)}" /><meta name="twitter:image" content="${escapeHtml(preview.image)}" />`
      : "";
  const tags = `<title>${title}</title><meta name="description" content="${description}" /><meta property="og:type" content="website" /><meta property="og:title" content="${title}" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${url}" /><meta property="og:site_name" content="Link" /><meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" /><meta name="twitter:title" content="${title}" /><meta name="twitter:description" content="${description}" />${image}<link rel="canonical" href="${url}" />`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/i, "")
    .replace("</head>", `${tags}</head>`);
}

export async function loadSharingPreview(
  apiBase: string,
  slug: string,
): Promise<{ preview: SharingPreview | null; status: number }> {
  try {
    const response = await fetch(
      `${apiBase.replace(/\/$/, "")}/link/public/${encodeURIComponent(slug)}/preview`,
      { signal: AbortSignal.timeout(4000), cache: "no-store" },
    );
    if (!response.ok)
      return {
        preview: null,
        status: [404, 410].includes(response.status) ? response.status : 200,
      };
    const data = await response.json();
    if (
      typeof data.title !== "string" ||
      typeof data.description !== "string" ||
      typeof data.url !== "string"
    )
      return { preview: null, status: 200 };
    return {
      preview: {
        title: data.title,
        description: data.description,
        image: typeof data.image === "string" ? data.image : null,
        url: data.url,
      },
      status: 200,
    };
  } catch {
    return { preview: null, status: 200 };
  }
}
