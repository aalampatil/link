import ApiError from "../../utils/api-error.js";

export function isExpired(validity: Date | string | null, now = new Date()) {
  return validity !== null && new Date(validity).getTime() <= now.getTime();
}

export function assertActive(validity: Date | string | null) {
  if (isExpired(validity)) throw ApiError.gone("Link has expired");
}

export function extendedValidity(
  validity: Date | null,
  days: number,
  now = new Date(),
) {
  return new Date(
    Math.max(validity?.getTime() ?? 0, now.getTime()) + days * 86_400_000,
  );
}
