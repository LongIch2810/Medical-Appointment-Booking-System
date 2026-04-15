import { useContext } from "react";

import { PatientPortalContext } from "@/pages/patient/PatientPortalContextObject";

export const usePatientPortal = () => {
  const context = useContext(PatientPortalContext);
  if (!context) {
    throw new Error("usePatientPortal must be used inside PatientPortalProvider");
  }
  return context;
};
