import { createContext } from "react";

import type {
  ConsultationConversation,
  ConsultationMessage,
  HealthRecordData,
  HealthProfileId,
  HealthProfileTarget,
  PatientAppointment,
  PatientRelatives,
  PatientProfile,
  PatientSettings,
  VisitResult,
} from "@/pages/patient/patientTypes";

export type RelativesDraft = Omit<PatientRelatives, "id"> & {
  id?: number;
};

export interface PatientPortalContextValue {
  profile: PatientProfile;
  updateProfile: (profile: PatientProfile) => void;
  appointments: PatientAppointment[];
  cancelAppointment: (appointmentId: number) => void;
  dependents: PatientRelatives[];
  saveDependent: (relatives: RelativesDraft) => void;
  removeDependent: (relativesId: number) => void;
  settings: PatientSettings;
  updateSetting: (key: keyof PatientSettings, value: boolean) => void;
  conversations: ConsultationConversation[];
  selectedConversationId: number;
  selectConversation: (conversationId: number) => void;
  messages: ConsultationMessage[];
  sendMessage: (content: string) => void;
  healthRecord: HealthRecordData;
  healthProfileTargets: HealthProfileTarget[];
  selectedHealthProfileId: HealthProfileId;
  selectHealthProfile: (profileId: HealthProfileId) => void;
  healthRecordsByProfileId: Partial<Record<HealthProfileId, HealthRecordData>>;
  selectedHealthRecord: HealthRecordData | null;
  visitResults: VisitResult[];
}

export const PatientPortalContext =
  createContext<PatientPortalContextValue | null>(null);
