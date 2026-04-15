import type { Role } from "../global";

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  fullname: string | null;
  gender: boolean;
  dateOfBirth: Date | null;
  picture: string | null;
  address: string | null;
  isAdmin: boolean;
  roles: Role[];
  permissions: string[];
}
