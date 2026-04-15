import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

dotenv.config();

const healthProfileSchema = z.object({
  fullname: z.string(),
  gender: z.string(),
  weight: z.number(),
  height: z.number(),
  blood_type: z.string(),
  medical_history: z.string(),
  allergies: z.string(),
  heart_rate: z.string(),
  blood_pressure: z.string(),
  glucose_level: z.string(),
  cholesterol_level: z.string(),
  medications: z.string(),
  vaccinations: z.string(),
  smoking: z.string(),
  alcohol_consumption: z.string(),
  exercise_frequency: z.string(),
  last_checkup_date: z.string(),
});

export type HealthProfile = z.infer<typeof healthProfileSchema>;

export const GetHealthProfileTool = tool(
  async ({ relative_id, token }: { relative_id: number; token: string }) => {
    try {
      if (!token) {
        return "Lỗi: Người dùng chưa đăng nhập. Không thể lấy hồ sơ sức khỏe của bạn.";
      }

      const response = await axios.get(
        `${process.env.BACKEND_URL}/api/v1/health-profiles/info/${relative_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const healthProfile = response.data?.data;
      const formattedHealthProfile: HealthProfile = {
        fullname: healthProfile.fullname,
        gender: healthProfile.gender ? "Nam" : "Nữ",
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
        const errMsg = error.response?.data?.message || "Không thể lấy hồ sơ.";
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
