import { backendOrigin } from "@/configs/axios";

export function getBackendDocumentUrl(path: string, download = false) {
  const normalizedPath = path.startsWith("http")
    ? path
    : `${backendOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
  const url = new URL(normalizedPath);
  if (download) url.searchParams.set("download", "true");
  return url.toString();
}

export function openBackendDocument(path: string, download = false) {
  const url = getBackendDocumentUrl(path, download);
  const openedWindow = window.open(url, "_blank");
  if (openedWindow) openedWindow.opener = null;
}
