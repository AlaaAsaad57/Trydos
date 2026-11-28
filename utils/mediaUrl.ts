// Single source of truth for media-server URLs derived from
// NEXT_PUBLIC_MEDIA_SERVER_BASE_URL (e.g. "https://media_server.ramaaz.dev").
//
// Reads NEXT_PUBLIC_MEDIA_SERVER_BASE_URL with direct dot notation so Next.js
// statically inlines it into client bundles, strips any trailing slash, and
// returns "" (never "undefined/image/upload") when unset.

export function getMediaServerBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
}

export function getMediaImageBaseUrl(): string {
  const base = getMediaServerBaseUrl();
  if (!base) return "";
  return base.endsWith("/image/upload") ? base : `${base}/image/upload`;
}

export function getMediaVideoBaseUrl(): string {
  const base = getMediaServerBaseUrl();
  if (!base) return "";
  return base.endsWith("/video/upload") ? base : `${base}/video/upload`;
}
