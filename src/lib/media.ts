/**
 * The backend's local storage stub returns absolute URLs such as
 * `http://localhost:4000/storage/photos/x.jpeg`. Rewrite those to the
 * same-origin `/storage/...` path, which next.config.mjs proxies to the
 * backend — so the browser never needs to reach the API host directly.
 * Other URLs (Unsplash, Cloudinary, …) are returned unchanged.
 */
export function mediaUrl(url?: string | null): string {
  if (!url) return "";
  return url.replace(/^https?:\/\/[^/]+(?=\/storage\/)/, "");
}
