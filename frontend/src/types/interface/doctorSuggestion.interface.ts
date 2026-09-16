export interface DoctorSuggestion {
  id: number;
  fullname: string;
  picture: string | null;
  specialty: string | null;
}

export interface SpecialtySuggestion {
  id: number;
  name: string;
}

export interface DoctorSuggestionsResult {
  doctors: DoctorSuggestion[];
  specialties: SpecialtySuggestion[];
}
