export interface CoachProfile {
  id: number;
  display_name: string;
  health_goal: string;
  preferences: string[] | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface CoachProfilePayload {
  display_name: string;
  health_goal: string;
  preferences?: string[];
  age?: number;
  height?: number;
  weight?: number;
}
