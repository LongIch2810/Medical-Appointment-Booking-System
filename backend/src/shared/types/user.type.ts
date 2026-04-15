type UserRoleResponse = {
  role_name: string;
  permissions: string[];
};

export type UserProfileResponse = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  fullname: string;
  password: string | null;
  picture: string | null;
  gender: boolean | null;
  date_of_birth: Date | null;
  address: string | null;
  isAdmin: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  roles: UserRoleResponse[];
};
