import { getChatModel } from "../configs/llm.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import httpClient from "../configs/httpClient.js";
import { withRetry } from "../utils/retry.js";
import { logSafeError } from "../utils/safeLog.js";

dotenv.config();

const specialtySchema = z.object({
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
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
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

    // Model/gateway phía sau OPENAI_BASE_URL đôi khi không thực sự gọi function
    // (dù đã ép method: "functionCalling"), khiến invoke() trả về undefined
    // thay vì object/throw — kiểm tra rõ ràng thay vì destructure trực tiếp
    // để tránh crash (xem lỗi tương tự đã gặp ở relative_analyzer.tool.ts).
    let extractedData: { candidates: string[] } | undefined;
    try {
      extractedData = await structuredModel.invoke([
        ["system", systemPrompt],
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
    console.log(
      "[AnalyzeSpecialtyTool] Chuyên khoa LLM chẩn đoán:",
      candidateNames,
    );

    const byNormalizedName = new Map(
      specialties.map((s) => [normalize(s.name), s]),
    );
    const candidate_specialties = candidateNames
      .map((name) => byNormalizedName.get(normalize(name)))
      .filter((s): s is SpecialtyRow => Boolean(s));

    console.log(
      "[AnalyzeSpecialtyTool] Chuyên khoa đã map sang id:",
      candidate_specialties,
    );

    return { candidate_specialties };
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
