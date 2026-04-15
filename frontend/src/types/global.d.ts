import type { DoctorSchedule } from "./interface/doctorSchedule.interface";

export interface DoctorCardData {
  id: number;
  user_id: number;
  fullname: string;
  picture: string | null;
  workplace: string;
  experience: number;
  doctor_level: string;
  avg_rating: number;
  appointments_completed: number;
  specialty: string;
  address: string;
  phone: string;
  isOutstanding: boolean;
}

export interface DoctorCardProps {
  item: DoctorCardData;
}

export interface DoctorScheduleCardProps {
  item: DoctorSchedule;
  selectedDate: Date;
}

export interface TitleProps {
  text: string;
  className?: string;
  align?: "left" | "center" | "right";
}

export interface SpecialtyProps {
  name: string;
  img_url: string;
}

export interface FeatureItemProps {
  title: string;
  className?: string;
  description: string;
}

export interface LineProps {
  color?: string;
  thickness?: string;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface FilterItemProps {
  className?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export type Role = {
  id: number;
  role_name: string;
  role_code: number;
};
