export const expiryLabel = (validity: string | null) => {
  if (!validity) return "No expiry date";
  const days = Math.ceil((new Date(validity).getTime() - Date.now()) / 86_400_000);
  return days <= 0 ? "Expired — renew to reopen" : `${days} day${days === 1 ? "" : "s"} remaining`;
};
