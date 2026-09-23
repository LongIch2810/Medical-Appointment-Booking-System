import { getAdminReportFileUrl } from "@/api/adminReportApi";

export async function openAdminReportFile(id: number, download = false) {
  const reportWindow = window.open("about:blank", "_blank");
  if (!reportWindow) {
    throw new Error("The report window was blocked by the browser.");
  }
  reportWindow.opener = null;

  try {
    const url = await getAdminReportFileUrl(id, download);
    reportWindow.location.replace(url);
  } catch (error) {
    reportWindow.close();
    throw error;
  }
}
