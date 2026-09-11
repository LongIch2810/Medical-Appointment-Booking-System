import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import { withRetry } from "../utils/retry.js";

dotenv.config();

const healthProfileSchema = z.object({
  fullname: z.string(),
  gender: z.string(),
  weight: z.number().nullable(),
  height: z.number().nullable(),
  blood_type: z.string().nullable(),
  medical_history: z.string().nullable(),
  allergies: z.string().nullable(),
  heart_rate: z.number().nullable(),
  blood_pressure: z.string().nullable(),
  glucose_level: z.number().nullable(),
  cholesterol_level: z.number().nullable(),
  medications: z.string().nullable(),
  vaccinations: z.string().nullable(),
  smoking: z.string(),
  alcohol_consumption: z.string(),
  exercise_frequency: z.string().nullable(),
  last_checkup_date: z.string().nullable(),
});

export type HealthProfile = z.infer<typeof healthProfileSchema>;

export const GetHealthProfileTool = tool(
  async ({ relative_id, token }: { relative_id: number; token: string }) => {
    try {
      if (!token) {
        return "Lỗi: Người dùng chưa đăng nhập. Không thể lấy hồ sơ sức khỏe của bạn.";
      }

      const response = await withRetry(
        () => axios.get(
          `${process.env.BACKEND_URL}/api/v1/health-profiles/${relative_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
        { operation: "health_profile_get" },
      );
      const healthProfile = response.data?.data;

      if (!healthProfile) {
        return "Lỗi từ API khi lấy hồ sơ sức khỏe: Dữ liệu hồ sơ trống.";
      }

      const patient = healthProfile.patient;
      const formattedHealthProfile: HealthProfile = {
        fullname: patient?.fullname || "Chưa cập nhật",
        gender:
          patient?.gender === true
            ? "Nam"
            : patient?.gender === false
              ? "Nữ"
              : "Chưa cập nhật",
        weight: healthProfile.weight,
        height: healthProfile.height,
        blood_type: healthProfile.blood_type,
        medical_history: healthProfile.medical_history,
        allergies: healthProfile.allergies,
        heart_rate: healthProfile.heart_rate,
        blood_pressure: healthProfile.blood_pressure,
        glucose_level: healthProfile.glucose_level,
        cholesterol_level: healthProfile.cholesterol_level,
        medications: healthProfile.medications,
        vaccinations: healthProfile.vaccinations,
        smoking: healthProfile.smoking ? "Có" : "Không",
        alcohol_consumption: healthProfile.alcohol_consumption ? "Có" : "Không",
        exercise_frequency: healthProfile.exercise_frequency,
        last_checkup_date: healthProfile.last_checkup_date,
      };

      return formattedHealthProfile;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
          | {
              message?: string;
              error?: { details?: string | string[] };
            }
          | undefined;
        const details = responseData?.error?.details;
        const errMsg =
          responseData?.message ||
          (typeof details === "string" ? details : details?.[0]) ||
          "Không thể lấy hồ sơ.";
        return `Lỗi từ API khi lấy hồ sơ sức khỏe: ${errMsg}`;
      }
      return "Lỗi không xác định khi lấy hồ sơ sức khỏe.";
    }
  },
  {
    name: "get_health_profile_tool",
    description: `Dùng công cụ này để lấy thông tin hồ sơ sức khỏe của người dùng đã đăng nhập.
Trả về thông tin chi tiết về tình trạng sức khỏe.`,
    schema: z.object({
      relative_id: z.number().describe("id người được lấy hồ sơ sức khỏe"),
      token: z.string().describe("khóa để giúp xác thực trước khi gọi api"),
    }),
  }
);
