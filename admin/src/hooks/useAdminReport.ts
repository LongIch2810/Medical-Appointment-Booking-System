import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";

import { generateAdminReport } from "@/api/adminReportApi";

type AdminReportErrorResponse = {
  error?: {
    details?: string | string[];
  };
};

const DEFAULT_ERROR_MESSAGE =
  "Không thể tạo báo cáo lúc này. Vui lòng thử lại.";

function readAdminReportError(error: unknown) {
  if (!isAxiosError<AdminReportErrorResponse>(error)) {
    return DEFAULT_ERROR_MESSAGE;
  }

  const details = error.response?.data?.error?.details;
  if (Array.isArray(details)) return details.join(" ");
  return details || DEFAULT_ERROR_MESSAGE;
}

export function useGenerateAdminReport() {
  return useMutation({
    mutationFn: generateAdminReport,
    onError: (error) => {
      toast.error(readAdminReportError(error));
    },
  });
}
