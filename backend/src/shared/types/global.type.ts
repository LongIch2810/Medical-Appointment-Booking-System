import Doctor from 'src/entities/doctor.entity';

export type Arrange = 'desc' | 'asc';

export type DoctorOutstanding = Doctor & {
  avg_rating: number;
  appointments_completed: number;
};

export type DoctorOutstandingWithIsOutstanding = DoctorOutstanding & {
  isOutstanding: boolean;
};

export type RequestPaylaod = {
  userId: number;
  roles: string[];
  tokenId: string;
  sessionVersion: number;
};

export type PgDriverError = {
  code: string;
  constraint: string;
};
