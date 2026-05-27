import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  ChangePasswordPayload,
  CreateUserPayload,
  PatientListResponse,
  RoleSummary,
  UpdateUserFieldsPayload,
  UpdateUserRolesPayload,
  User,
  UserListPayload,
  UserListResponse,
} from "@/types/interface/user.interface";

type RawRoleSummary = RoleSummary & {
  role?: RoleSummary;
};

type RawUser = Omit<User, "roles"> & {
  is_locking?: boolean;
  roles?: RawRoleSummary[];
};

function normalizeUser(user: RawUser): User {
  return {
    ...user,
    is_locked: user.is_locked ?? user.is_locking,
    roles:
      user.roles?.map((role) => ({
        ...(role.role ?? role),
        role_name: role.role?.role_name ?? role.role_name,
      })) ?? [],
  };
}

function normalizeUserListResponse(data: UserListResponse): UserListResponse {
  return {
    ...data,
    users: (data.users as RawUser[]).map(normalizeUser),
  };
}

export const fetchCurrentUser = async () => {
  const res = await axiosInstance.get<ApiResponse<RawUser>>("/users/info");
  return {
    ...res.data,
    data: normalizeUser(res.data.data),
  };
};

export const updateCurrentUser = async (data: UpdateUserFieldsPayload, file?: File) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else {
      formData.append(key, String(value));
    }
  });
  if (file) {
    formData.append("file", file);
  }
  const res = await axiosInstance.patch<ApiResponse<User>>(
    "/users/update-info",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
};

export const changePassword = async (data: ChangePasswordPayload) => {
  const res = await axiosInstance.put<ApiResponse<{ message: string }>>(
    "/users/change-password",
    data,
  );
  return res.data;
};

export const fetchUsers = async (data: UserListPayload) => {
  const res = await axiosInstance.post<ApiResponse<UserListResponse>>(
    "/users/users",
    data,
  );
  return {
    ...res.data,
    data: normalizeUserListResponse(res.data.data),
  };
};

export const fetchPatients = async (data: UserListPayload) => {
  const res = await axiosInstance.post<
    ApiResponse<UserListResponse & Partial<PatientListResponse>>
  >(
    "/users/patients",
    data,
  );
  const normalized = normalizeUserListResponse(res.data.data);
  return {
    ...res.data,
    data: {
      ...normalized,
      patients: normalized.users,
    },
  };
};

export const fetchUserDetail = async (userId: number) => {
  const res = await axiosInstance.get<ApiResponse<RawUser>>(`/users/${userId}`);
  return {
    ...res.data,
    data: normalizeUser(res.data.data),
  };
};

export const lockUser = async (userId: number) => {
  const res = await axiosInstance.patch<ApiResponse<User>>(
    `/users/${userId}/lock`,
  );
  return res.data;
};

export const unlockUser = async (userId: number) => {
  const res = await axiosInstance.patch<ApiResponse<User>>(
    `/users/${userId}/unlock`,
  );
  return res.data;
};

export const activateUser = async (userId: number) => {
  const res = await axiosInstance.patch<ApiResponse<User>>(
    `/users/${userId}/activate`,
  );
  return res.data;
};

export const deactivateUser = async (userId: number) => {
  const res = await axiosInstance.patch<ApiResponse<User>>(
    `/users/${userId}/deactivate`,
  );
  return res.data;
};

export const createUser = async (data: CreateUserPayload) => {
  const res = await axiosInstance.post<ApiResponse<User>>(
    "/users/create",
    data,
  );
  return res.data;
};

export const updateUserRoles = async (
  userId: number,
  data: UpdateUserRolesPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<User>>(
    `/users/${userId}/roles`,
    data,
  );
  return res.data;
};
