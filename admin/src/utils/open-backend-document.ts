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
  window.open(
    getBackendDocumentUrl(path, download),
    "_blank",
    "noopener,noreferrer",
  );
}
