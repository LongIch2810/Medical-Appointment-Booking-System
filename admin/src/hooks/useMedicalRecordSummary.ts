import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  getMedicalRecordErrorMessage,
  summarizeMedicalRecord,
} from "@/api/medicalRecordApi";
import type { ApiResponse } from "@/types/interface/api.interface";
import type { ApiError } from "@/types/interface/apiError.interface";
import type {
  MedicalRecordSummaryData,
  MedicalRecordUploadMode,
} from "@/types/interface/medicalRecord.interface";

export interface SummarizeMedicalRecordVariables {
  files: File[];
  mode: MedicalRecordUploadMode;
}

export function useMedicalRecordSummary() {
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const mutation = useMutation<
    ApiResponse<MedicalRecordSummaryData>,
    AxiosError<ApiError>,
    SummarizeMedicalRecordVariables
  >({
    mutationFn: ({ files, mode }) => summarizeMedicalRecord(files, mode),
    onSuccess: () => {
      setGeneratedAt(new Date());
    },
  });

  const resetSummary = () => {
    mutation.reset();
    setGeneratedAt(null);
  };

  const summary = mutation.data?.data?.summary ?? null;
  const friendlyError = mutation.error
    ? getMedicalRecordErrorMessage(mutation.error)
    : null;

  return {
    ...mutation,
    summary,
    friendlyError,
    generatedAt,
    resetSummary,
  };
}
