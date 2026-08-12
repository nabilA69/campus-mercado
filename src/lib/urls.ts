/**
 * Accepts what people actually type ("example.com", "www.example.com/promo",
 * "HTTPS://Example.com ") and returns a canonical absolute URL, or null if it
 * isn't a usable link. Site-relative paths ("/uploads/x.png") pass through.
 */
export function normalizeUrl(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  // already a site-relative path — keep as-is
  if (raw.startsWith("/")) return raw;

  // If it carries a scheme at all, it must be http(s). This rejects javascript:,
  // data:, mailto: etc. before we could accidentally coerce them into an http URL.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  if (hasScheme && !/^https?:\/\//i.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(hasScheme ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // never accept embedded credentials (https://user:pass@host)
  if (url.username || url.password) return null;
  // a hostname must look like a domain (has a dot) or be localhost
  if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;

  return url.toString();
}

export function isUsableUrl(input: string | null | undefined): boolean {
  return normalizeUrl(input) !== null;
}

/** Ad placements, kept in one place so the UI and the server agree. */
export const AD_POSITIONS = ["home_top", "sidebar", "listing_inline"] as const;
export type AdPosition = (typeof AD_POSITIONS)[number];

export function isAdPosition(v: string): v is AdPosition {
  return (AD_POSITIONS as readonly string[]).includes(v);
}
