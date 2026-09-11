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
