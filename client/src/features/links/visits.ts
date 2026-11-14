import { publicAxiosApi } from "@/config/axiosApi";
const visits = new Map<string, { key: string; expiresAt: number }>();

export function trackVisit(slug: string) {
  let visit = visits.get(slug);
  try {
    visit =
      JSON.parse(sessionStorage.getItem(`link-visit:${slug}`) ?? "null") ??
      visit;
  } catch {
    /* Storage may be disabled. */
  }
  if (!visit || typeof visit.key !== "string" || visit.expiresAt <= Date.now())
    visit = { key: crypto.randomUUID(), expiresAt: Date.now() + 30 * 60000 };
  visits.set(slug, visit);
  try {
    sessionStorage.setItem(`link-visit:${slug}`, JSON.stringify(visit));
  } catch {
    /* Use the in-memory session. */
  }
  return publicAxiosApi
    .post(
      `/link/public/${slug}/visit`,
      { visitKey: visit.key },
      { timeout: 1000 },
    )
    .catch(() => {});
}
