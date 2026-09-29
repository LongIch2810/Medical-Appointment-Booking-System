import { getChatModel } from "../configs/llm.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import httpClient from "../configs/httpClient.js";
import { withRetry } from "../utils/retry.js";
import { logSafeError } from "../utils/safeLog.js";

dotenv.config();

const specialtySchema = z.object({
  preferred_doctor: z
    .string()
    .nullable()
    .optional()
    .describe("Doctor name explicitly requested by the user, excluding titles; otherwise null."),
  preferred_location: z
    .string()
    .nullable()
    .optional()
    .describe("City or district explicitly requested by the user; otherwise null."),
  candidates: z
    .array(z.string())
    .describe(
      "Danh sách tên chuyên khoa (đúng NGUYÊN VĂN từ danh sách được cung cấp), xếp theo mức độ phù hợp giảm dần. Mảng rỗng nếu không có chuyên khoa nào phù hợp hoặc câu chỉ mô tả người.",
    ),
});

const model = getChatModel({ profile: "fast", temperature: 0 });
// method: "functionCalling" — cùng lý do như relative_analyzer.tool.ts: model/
// gateway phía sau OPENAI_BASE_URL không đáng tin cậy ở chế độ structured-output
// mặc định (response_format json_schema), có thể trả về text thô thay vì
// JSON hợp lệ. Tool/function-calling được hỗ trợ rộng rãi hơn.
const structuredModel = model.withStructuredOutput(specialtySchema, {
  method: "functionCalling",
});

interface SpecialtyRow {
  id: number;
  name: string;
}

// So khớp không phân biệt hoa/thường và dấu tiếng Việt — phòng trường hợp
// LLM trả về tên gần-đúng-ký-tự (vd sai dấu) dù đã được yêu cầu chọn nguyên
// văn từ danh sách cung cấp.
function normalize(str: string): string {
  return str.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function normalizePhrase(str: string): string {
  return normalize(str).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

const GENERIC_DOCTOR_REFERENCES = new Set([
  "ai",
  "nao",
  "bat ky",
  "phu hop",
  "con lich",
  "gan nhat",
  "gioi",
  "tot",
]);

export function isGenericDoctorReference(value: string | null | undefined): boolean {
  if (!value) return true;
  const normalized = normalizePhrase(value);
  return !normalized || GENERIC_DOCTOR_REFERENCES.has(normalized);
}

function extractExplicitDoctorName(text: string): string | null {
  const cue = /(?:^|[^\p{L}])(?:bác\s*sĩ|bs\.?)\s+/iu.exec(text);
  if (!cue) return null;
  const remainder = text.slice(cue.index + cue[0].length);
  const match = remainder.match(
    /^((?:\p{Lu}[\p{L}'’.-]*\s+){1,3}\p{Lu}[\p{L}'’.-]*)(?=\s+(?:ở|tại|chuyên khoa|ngày|lúc|vào|cho|giúp|được|có|khi|với|khám|muốn|đặt|lịch|đến|và|không|ơi|ạ|nhé)\b|[,.;!?]|$)/u,
  );
  return match?.[1]?.trim() ?? null;
}

async function fetchSpecialties(): Promise<SpecialtyRow[]> {
  const res = await withRetry(
    () =>
      httpClient.post(`${process.env.BACKEND_URL}/api/v1/specialties`, {
        page: 1,
        limit: 100,
        arrange: "asc",
      }),
    { operation: "specialties_list" },
  );
  return res.data?.data?.specialties ?? [];
}

function buildSystemPrompt(specialtyNames: string[]): string {
  return `
Bạn là hệ thống chẩn đoán chuyên khoa y tế thông minh.
Nhiệm vụ: dựa vào TRIỆU CHỨNG hoặc mô tả y tế trong văn bản tiếng Việt của người dùng, hãy chọn ra các chuyên khoa phù hợp nhất để khám.

Danh sách chuyên khoa hiện có trong hệ thống (CHỈ được chọn tên xuất hiện NGUYÊN VĂN trong danh sách dưới đây, TUYỆT ĐỐI KHÔNG tự bịa hoặc suy ra tên chuyên khoa khác không có trong danh sách):
${specialtyNames.map((n) => `- ${n}`).join("\n")}

Luật hoạt động:
1. Chỉ chọn khi trong câu có yếu tố y tế thật sự — ví dụ: đau, viêm, sốt, mệt, tim, da, mắt, tai, mũi, họng, dạ dày, nội tiết, thần kinh, v.v.
2. Nếu câu **chỉ mô tả người** (ví dụ: "con gái tôi", "bé Lan", "trẻ em", "mẹ tôi", "người lớn", "bố tôi") mà KHÔNG có triệu chứng hoặc bộ phận cơ thể, thì **kết quả phải là mảng rỗng []**.
3. KHÔNG được tự suy luận chuyên khoa từ đối tượng người (ví dụ: KHÔNG được tự hiểu "trẻ em", "bé" → "Nhi khoa" nếu không có triệu chứng đi kèm).
4. Nếu có nhiều triệu chứng liên quan đến nhiều chuyên khoa khác nhau, hãy trả về TẤT CẢ các chuyên khoa phù hợp, xếp theo mức độ phù hợp giảm dần (chuyên khoa phù hợp nhất đứng đầu mảng).
5. Nếu không có chuyên khoa nào trong danh sách phù hợp với triệu chứng mô tả, trả về mảng rỗng [] — KHÔNG chọn đại một chuyên khoa gần đúng.

Ví dụ (giả sử danh sách có "Da liễu", "Mắt", "Tim mạch", "Thần kinh"):
Input: "Tôi bị đau mắt và chảy nước mắt" → Output: ["Mắt"]
Input: "Tôi bị ngứa da và nổi mẩn đỏ" → Output: ["Da liễu"]
Input: "Tôi bị đau đầu, chóng mặt" → Output: ["Thần kinh"]
Input: "Tôi muốn đặt lịch khám cho con gái tôi" → Output: []
Input: "Cho bé Lan đi khám" → Output: []
Input: "Đặt lịch cho mẹ tôi" → Output: []
`;
}

// LLM chẩn đoán trực tiếp ra danh sách chuyên khoa THẬT (fetch từ backend
// mỗi lần gọi) thay vì trích từ khoá rồi dò từng chuỗi qua search API như
// trước — loại bỏ hoàn toàn rủi ro LLM chọn/bịa tên không khớp DB, vì LLM
// chỉ được chọn trong đúng danh sách được cung cấp. id đã biết ngay tại đây
// (map trong bộ nhớ), không cần vòng gọi API "resolve" riêng nữa.
export const AnalyzeSpecialtyTool = tool(
  async ({ text_input }: { text_input: string }) => {
    let specialties: SpecialtyRow[];
    try {
      specialties = await fetchSpecialties();
    } catch (error) {
      logSafeError("[AnalyzeSpecialtyTool] Specialty lookup failed", error);
      return { candidate_specialties: [], resolve_error: true };
    }

    if (!specialties || specialties.length === 0) {
      console.error("[AnalyzeSpecialtyTool] Danh sách chuyên khoa rỗng.");
      return { candidate_specialties: [], resolve_error: true };
    }

    const systemPrompt = buildSystemPrompt(specialties.map((s) => s.name));
    const extractionPrompt = `${systemPrompt}\n\nExtract booking preferences separately from symptoms:\n- preferred_doctor: only a named doctor the user explicitly asks for; remove titles such as 'doctor' or 'bác sĩ'; otherwise null.\n- preferred_location: only a city or district in the doctor's registered address that the user explicitly asks for; otherwise null.\nNever infer either preference from symptoms or invent details.`;

    // Model/gateway phía sau OPENAI_BASE_URL đôi khi không thực sự gọi function
    // (dù đã ép method: "functionCalling"), khiến invoke() trả về undefined
    // thay vì object/throw — kiểm tra rõ ràng thay vì destructure trực tiếp
    // để tránh crash (xem lỗi tương tự đã gặp ở relative_analyzer.tool.ts).
    let extractedData:
      | {
          candidates: string[];
          preferred_doctor?: string | null;
          preferred_location?: string | null;
        }
      | undefined;
    try {
      extractedData = await structuredModel.invoke([
        ["system", extractionPrompt],
        [
          "human",
          `Phân tích triệu chứng/chuyên khoa từ câu sau: ${text_input}`,
        ],
      ]);
    } catch (error) {
      logSafeError("[AnalyzeSpecialtyTool] LLM diagnosis failed", error);
      return { candidate_specialties: [], resolve_error: true };
    }

    if (!extractedData) {
      console.error(
        "[AnalyzeSpecialtyTool] LLM không trả về kết quả hợp lệ (undefined).",
      );
      return { candidate_specialties: [], resolve_error: true };
    }

    const candidateNames = extractedData.candidates || [];

    const byNormalizedName = new Map(
      specialties.map((s) => [normalize(s.name), s]),
    );
    const candidate_specialties = candidateNames
      .map((name) => byNormalizedName.get(normalize(name)))
      .filter((s): s is SpecialtyRow => Boolean(s));

    const cleanPreference = (value: string | null | undefined, maxLength: number) => {
      const cleaned = value?.trim().replace(/\s+/g, " ");
      return cleaned && cleaned.length <= maxLength ? cleaned : null;
    };
    const extractedDoctor = cleanPreference(
      extractedData.preferred_doctor,
      120,
    );
    const explicitDoctorName = extractExplicitDoctorName(text_input);
    const doctorAppearsInRequest =
      extractedDoctor &&
      normalizePhrase(text_input).includes(normalizePhrase(extractedDoctor));
    const preferred_doctor = explicitDoctorName ||
      (doctorAppearsInRequest && !isGenericDoctorReference(extractedDoctor)
        ? extractedDoctor
        : null);
    const extractedLocation = cleanPreference(
      extractedData.preferred_location,
      160,
    );
    const preferred_location =
      extractedLocation &&
      normalizePhrase(text_input).includes(normalizePhrase(extractedLocation))
        ? extractedLocation
        : null;

    return {
      candidate_specialties,
      preferred_doctor,
      preferred_location,
      // A doctor name is optional. Generic requests such as "bác sĩ nào còn
      // lịch" or "bác sĩ phù hợp" must continue with automatic selection.
      // Ask for clarification only when the user appears to have supplied an
      // incomplete proper name after the doctor title.
      doctor_preference_unresolved:
        !preferred_doctor &&
        /(?:^|[^\p{L}])(?:bác\s*sĩ|bs\.?)\s+\p{Lu}[\p{L}'’.-]*(?:\s|[,.;!?]|$)/u.test(
          text_input,
        ),
    };
  },
  {
    name: "analyze_specialty_tool",
    description:
      "Phân tích văn bản mô tả triệu chứng để chẩn đoán các chuyên khoa y tế phù hợp (chọn từ danh sách chuyên khoa thật trong hệ thống).",
    schema: z.object({
      text_input: z
        .string()
        .describe(
          "Câu mô tả chuyên khoa tiếng Việt, ví dụ 'Tôi muốn khám chuyên khoa nhi.'",
        ),
    }),
  },
);
