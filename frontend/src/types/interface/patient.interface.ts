export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  data: T;
  error: unknown;
}

export interface PaginationResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: T[] | number;
}

export interface Relationship {
  id: number;
  relationship_code: string;
  relationship_name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientUser {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  fullname: string | null;
  gender: boolean;
  date_of_birth: string | null;
  picture: string | null;
  address: string | null;
  isAdmin: boolean;
}

export interface Relative {
  id: number;
  fullname: string | null;
  relationship: Relationship;
  phone: string | null;
  dob: string | null;
  gender: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthProfile {
  id: number;
  weight: number | null;
  height: number | null;
  blood_type: string | null;
  medical_history: string | null;
  allergies: string | null;
  heart_rate: number | null;
  blood_pressure: string | null;
  glucose_level: number | null;
  cholesterol_level: number | null;
  medications: string | null;
  vaccinations: string | null;
  smoking: boolean | null;
  alcohol_consumption: boolean | null;
  exercise_frequency: string | null;
  last_checkup_date: string | null;
  patient: Relative;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "ABSENT";

export interface SpecialtySummary {
  id?: number;
  name?: string;
  specialty_name?: string;
}

export interface DoctorUserSummary {
  id: number;
  fullname: string | null;
  picture: string | null;
  phone: string | null;
  address: string | null;
}

export interface DoctorSummary {
  id: number;
  experience: number;
  workplace: string;
  doctor_level: string;
  user: DoctorUserSummary;
  specialty: SpecialtySummary;
}

export interface AppointmentDoctorSchedule {
  id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface PatientAppointment {
  id: number;
  appointment_date: string;
  status: AppointmentStatus;
  booking_mode: "user_select" | "ai_select";
  doctor_schedule: AppointmentDoctorSchedule;
  patient: Relative;
  doctor: DoctorSummary;
  created_at: string;
  updated_at: string;
}

export interface ExaminationResult {
  id: number;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  appointment: PatientAppointment;
  created_at: string;
  updated_at: string;
}

export interface PatientDashboard {
  healthProfilesCount: number;
  upcomingAppointmentsCount: number;
  relativesCount: number;
  examinationResultsCount: number;
  personalHealthProfile: HealthProfile;
}

export interface ChannelParticipant {
  id: number;
  fullname: string | null;
  username?: string | null;
  picture: string | null;
}

export interface MessageAttachment {
  id: number;
  file_url: string;
  file_type: string;
}

export interface Message {
  id: number;
  message_type: "regular" | "call";
  content: string | null;
  is_read: boolean;
  message_attachments: MessageAttachment[];
  sender: ChannelParticipant;
  created_at: string;
  updated_at: string;
}

export interface LastMessage {
  content: string;
  created_at: string;
  sender_id: number;
}

export interface Channel {
  id: number;
  channel_id?: number;
  last_message: LastMessage | null;
  unread_count: number;
  participants: ChannelParticipant[];
  created_at: string;
  updated_at: string;
}

export type RelativeListResponse = PaginationResponse<Relative> & {
  relatives: Relative[];
};

export type RelationshipListResponse = PaginationResponse<Relationship> & {
  relationships: Relationship[];
};

export type HealthProfileListResponse = PaginationResponse<HealthProfile> & {
  healthProfiles: HealthProfile[];
};

export type AppointmentListResponse = PaginationResponse<PatientAppointment> & {
  appointments: PatientAppointment[];
};

export type ExaminationResultListResponse =
  PaginationResponse<ExaminationResult> & {
    examination_results: ExaminationResult[];
  };

export type ChannelListResponse = PaginationResponse<Channel> & {
  channels: Channel[];
};

export type MessageListResponse = PaginationResponse<Message> & {
  messages: Message[];
};

export interface RelativePayload {
  fullname: string;
  relationship_code: string;
  phone: string;
  dob: string;
  gender: boolean;
}

export type UpdateRelativePayload = Partial<RelativePayload>;

export interface HealthProfilePayload {
  weight?: number;
  height?: number;
  blood_type?: string;
  medical_history?: string;
  allergies?: string;
  heart_rate?: number;
  blood_pressure?: string;
  glucose_level?: number;
  cholesterol_level?: number;
  medications?: string;
  vaccinations?: string;
  smoking?: boolean;
  alcohol_consumption?: boolean;
  exercise_frequency?: string;
  last_checkup_date?: string;
}

export interface PersonalAppointmentsPayload {
  page: number;
  limit: number;
  appointmentStatus?: AppointmentStatus;
  relativeId?: number;
}

export interface PatientListPayload {
  page: number;
  limit: number;
  search?: string;
  arrange?: "asc" | "desc";
}

export interface SendMessagePayload {
  message_type: "regular";
  content: string;
  sender_id: number;
  channel_id: number;
}
