export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "completed"
  | "cancelled";

export interface PatientProfile {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  insuranceNumber: string;
  emergencyContact: string;
}

export interface PatientAppointment {
  id: number;
  doctorName: string;
  specialty: string;
  clinic: string;
  date: string;
  time: string;
  fee: string;
  status: AppointmentStatus;
}

export interface PatientRelatives {
  id: number;
  fullName: string;
  relationship: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  insuranceNumber: string;
}

export interface PatientSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderNotifications: boolean;
  shareMedicalData: boolean;
  twoFactorAuth: boolean;
}

export interface ConsultationConversation {
  id: number;
  doctorName: string;
  specialty: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export type MessageSender = "doctor" | "patient";

export interface ConsultationMessage {
  id: number;
  conversationId: number;
  sender: MessageSender;
  content: string;
  sentAt: string;
}

export interface HealthMetric {
  label: string;
  value: string;
  trend: string;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  schedule: string;
}

export interface HealthTimelineItem {
  id: number;
  date: string;
  event: string;
  detail: string;
}

export interface HealthRecordData {
  bloodType: string;
  height: string;
  weight: string;
  allergies: string[];
  chronicConditions: string[];
  medications: MedicationItem[];
  metrics: HealthMetric[];
  timeline: HealthTimelineItem[];
}

export type HealthProfileId = "owner" | `relative-${number}`;

export interface HealthProfileTarget {
  id: HealthProfileId;
  displayName: string;
  relationship: string;
}

export interface VisitResult {
  id: number;
  visitDate: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  recommendations: string[];
  prescriptions: string[];
  note: string;
}

export const getRelativeHealthProfileId = (
  relativeId: number,
): HealthProfileId => `relative-${relativeId}`;
