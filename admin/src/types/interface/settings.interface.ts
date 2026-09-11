export type UserTheme = "SYSTEM" | "LIGHT" | "DARK";

export interface UserSettings {
  realtimeToastsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  appointmentRemindersEnabled: boolean;
  theme: UserTheme;
  effectiveAppointmentReminderBeforeMinutes: number;
  updatedAt: string;
}

export type UpdateUserSettings = Partial<
  Pick<
    UserSettings,
    | "realtimeToastsEnabled"
    | "emailNotificationsEnabled"
    | "appointmentRemindersEnabled"
    | "theme"
  >
>;

export interface SystemSettings {
  id: number;
  appointmentRemindersEnabled: boolean;
  appointmentReminderBeforeMinutes: number;
  appointmentEmailsEnabled: boolean;
  defaultRealtimeToastsEnabled: boolean;
  defaultEmailNotificationsEnabled: boolean;
  defaultAppointmentRemindersEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdateSystemSettings = Partial<
  Omit<SystemSettings, "id" | "createdAt" | "updatedAt">
>;
