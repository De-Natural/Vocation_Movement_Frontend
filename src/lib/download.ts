import { apiClient, type RequestOptions } from "./api-client";

/**
 * Save a Blob as a file. The link is added to the page and the object URL is
 * released a moment later: revoking it straight after click() cancels the
 * download in some browsers (Firefox, Safari).
 */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

/** Download an authenticated API file (PDF/CSV) and save it under `filename`. */
export async function downloadApiFile(endpoint: string, filename: string, options?: RequestOptions) {
  const blob = await apiClient.get<Blob>(endpoint, { ...options, blob: true });
  saveBlob(blob, filename);
}
