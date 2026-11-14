export const expiryLabel = (validity: string | null) => {
  if (!validity) return "No expiry date";
  const days = Math.ceil(
    (new Date(validity).getTime() - Date.now()) / 86_400_000,
  );
  return days <= 0
    ? "Expired — renew to reopen"
    : `${days} day${days === 1 ? "" : "s"} remaining`;
};

export function dateInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function linkState(link: {
  linkValidity: string | null;
  paused: boolean;
  mappedUrl: string | null;
}) {
  return link.linkValidity &&
    new Date(link.linkValidity).getTime() <= Date.now()
    ? "expired"
    : link.paused
      ? "paused"
      : link.mappedUrl
        ? "ready"
        : "pending";
}
export const stateLabels = {
  expired: "Expired",
  paused: "Paused",
  ready: "Connected",
  pending: "In progress",
};
