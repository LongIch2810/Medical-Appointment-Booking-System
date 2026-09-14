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
  const link = document.createElement("a");
  link.href = getBackendDocumentUrl(path, download);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.hidden = true;

  document.body.appendChild(link);
  link.click();
  link.remove();
}
