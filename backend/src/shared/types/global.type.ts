import Doctor from 'src/entities/doctor.entity';

export type Arrange = 'desc' | 'asc';

export type DoctorOutstanding = Doctor & {
  avg_rating: number;
  appointments_completed: number;
};

export type DoctorOutstandingWithIsOutstanding = DoctorOutstanding & {
  isOutstanding: boolean;
};

export type Paylaod = {
  sub: number;
  roles: string[];
  tokenId: string;
  sessionVersion: number;
};

export type PgDriverError = {
  code: string;
  constraint: string;
};
