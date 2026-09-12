import { getChatModel } from "../configs/llm.js";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";

import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import httpClient from "../configs/httpClient.js";
import {
  detectExplicitRelationship,
  relationshipCodes,
  type RelationshipCode,
} from "../utils/explicitRelationship.js";
import { withRetry } from "../utils/retry.js";
import { logSafeError } from "../utils/safeLog.js";

dotenv.config();

const relativeCodeSchema = z.object({
  relationship_code: z.enum(relationshipCodes),
  name: z.string().nullable().describe("name is optional"),
  // Chỉ trích khi người dùng nói RÕ trong text_input — không suy đoán/bịa.
  // Dùng khi cần tạo mới hồ sơ người thân (xem findOrCreateForBooking ở
  // backend) lúc tra cứu không ra kết quả nào.
  dob: z
    .string()
    .nullable()
    .describe(
      "Ngày sinh người thân dạng YYYY-MM-DD, chỉ điền nếu người dùng nói rõ, null nếu không có",
    ),
  gender: z
    .boolean()
    .nullable()
    .describe(
      "Giới tính người thân: true = Nam, false = Nữ, chỉ điền nếu người dùng nói rõ hoặc suy ra chắc chắn từ cách xưng hô (vd 'con trai' => true), null nếu không rõ",
    ),
});

//Có 2 cách ép kiểu trả về với LLM
//cách 1: Ép kiểu theo từng bước
//tạo cấu trúc output parser từ zod schema
// const outputParser = StructuredOutputParser.fromZodSchema(relativeCodeSchema);

// console.log("=== Output Parser ===");
// console.log(outputParser);

//tạo bản hướng dẫn định dạng để đưa vào prompt
// const getFormatInstructions = outputParser.getFormatInstructions();

// console.log("=== Format Instructions ===");
// console.log(getFormatInstructions);
// console.log("===========================");

const systemPrompt = `
Bạn là hệ thống phân tích mối quan hệ tiếng Việt.
Nhiệm vụ của bạn là phân tích văn bản của người dùng và trả về MỘT mã quan hệ duy nhất dựa trên các quy tắc sau.

Quy tắc:
- Nếu văn bản chứa từ “bé”, hãy phân tích tên ngay sau từ “bé” để xác định giới tính. 
  Ví dụ: “bé Đạt” → tên “Đạt” thường là con trai, “bé Lan” → tên “Lan” thường là con gái.
- Từ chứa liên quan đến mẹ: "mẹ", "má", "mẹ ruột",... => me
- Từ chứa liên quan đến ba: "cha", "ba", "bố", "bố ruột",... => cha
- Từ chứa liên quan đến "con gái", "bé gái",... => con_gai
- Từ chứa liên quan đến "con trai", "bé trai",... => con_trai
- Từ chứa liên quan đến "vợ", "chồng", "ông xã", "bà xã",... => vo_chong
- Từ chứa liên quan đến "ông", "ông ngoại", "ông nội", "ông cố",... => ong
- Từ chứa liên quan đến "bà", "bà ngoại", "bà nội", "bà cố",... => ba
- Từ chứa liên quan đến họ hàng: "dượng", "dì", "cậu", "bác", "chú", "thím",...=> nguoi_than_khac
- Nếu không có từ khóa nào khớp => ban_than

Ví dụ khi không nhắc tới ai (mặc định là đặt cho chính người dùng, mã ban_than):
- "Đặt lịch khám răng vào sáng mai" => ban_than
- "Tôi bị đau đầu, chóng mặt, muốn đặt lịch khám" => ban_than
- "Đặt cho tôi một lịch khám tim mạch" => ban_than

Ngoài relationship_code, hãy trích thêm (nếu có trong văn bản):
- dob: ngày sinh, chuyển về định dạng YYYY-MM-DD. CHỈ điền khi người dùng nói rõ (vd "sinh ngày 1/5/2015"). Không được tự suy đoán hay bịa ngày sinh — không rõ thì để null.
- gender: true nếu là nam, false nếu là nữ. CHỈ điền khi người dùng nói rõ giới tính hoặc dùng từ xưng hô rõ giới tính (vd "con trai", "bé gái"). Không rõ thì để null — hệ thống sẽ tự suy ra giới tính từ relationship_code cho các trường hợp rõ ràng (con trai/con gái/ông/bà/cha/mẹ), bạn không cần suy đoán thêm.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["human", "Văn bản cần phân tích: {text_input}"], // Chỉ cần text input ở đây
]);

const model = getChatModel({ profile: "fast", temperature: 0 });

// method: "functionCalling" — model/gateway phía sau OPENAI_BASE_URL không trả
// JSON hợp lệ một cách đáng tin cậy ở chế độ structured-output mặc định
// (response_format json_schema): với schema đơn giản (đặc biệt khi chỉ có
// đúng 1 field cần điền, vd relationship_code="ban_than"), model trả thẳng
// chuỗi thô "ban_than" thay vì {"relationship_code":"ban_than",...}, khiến
// JSON.parse lỗi. Ép dùng tool/function-calling để yêu cầu JSON output —
// cơ chế này được hỗ trợ rộng rãi hơn json_schema mode ở các provider
// tương thích OpenAI nhưng không tuân thủ đầy đủ chuẩn structured output mới.
const structuredModel = model.withStructuredOutput(relativeCodeSchema, {
  method: "functionCalling",
});

const pipeline = promptTemplate.pipe(structuredModel);

export interface ParsedRelativeAnalysis {
  relationship_code?: RelationshipCode | null;
  name?: string | null;
  dob?: string | null;
  gender?: boolean | null;
}

export interface ResolvedRelativeAnalysis {
  relationship_code: RelationshipCode;
  name: string | null;
  dob: string | null;
  gender: boolean | null;
}

/**
 * Quyết định relationship_code/name/dob/gender cuối cùng từ quan hệ nhận
 * diện tường minh trong câu (regex, đáng tin cậy tuyệt đối) kết hợp với kết
 * quả LLM trích được (có thể sai/rỗng khi model/gateway lỗi). Tách riêng
 * khỏi tool() để unit test được precedence logic (explicit luôn thắng LLM)
 * mà không cần gọi LLM/axios thật.
 */
export function resolveRelativeAnalysis(
  explicitRelationship: Exclude<RelationshipCode, "ban_than"> | null,
  parsed: ParsedRelativeAnalysis | null | undefined,
): ResolvedRelativeAnalysis {
  let relationship_code: RelationshipCode = explicitRelationship ?? "ban_than";
  let name: string | null = null;
  let dob: string | null = null;
  let gender: boolean | null = null;

  if (parsed?.relationship_code) {
    if (!explicitRelationship) {
      relationship_code = parsed.relationship_code;
    }
    // Khi có explicitRelationship VÀ nó khác kết quả LLM, relationship_code
    // giữ nguyên giá trị explicit đã gán ở trên (explicit luôn thắng) — LLM
    // không được ghi đè, nhưng name/dob/gender trích được vẫn giữ lại.
    name = parsed.name ?? null;
    dob = parsed.dob ?? null;
    gender = parsed.gender ?? null;
  }

  return { relationship_code, name, dob, gender };
}

export const AnalyzeRelativeTool = tool(
  async ({ text_input, token }: { text_input: string; token: string }) => {
    // Một quan hệ nêu rõ trong câu phải luôn thắng LLM. Nếu LLM/gateway lỗi
    // mà chuyển "ba tôi" thành ban_than thì API có thể chọn nhầm hồ sơ bản
    // thân, nên chỉ dùng ban_than khi câu thật sự không nêu quan hệ nào.
    const explicitRelationship = detectExplicitRelationship(text_input);
    let parsed: ParsedRelativeAnalysis | null = null;
    try {
      parsed = await pipeline.invoke({ text_input });
      if (parsed?.relationship_code) {
        if (
          explicitRelationship &&
          parsed.relationship_code !== explicitRelationship
        ) {
          console.warn(
            "[AnalyzeRelativeTool] Ưu tiên quan hệ nhận diện từ câu thay cho kết quả LLM:",
            explicitRelationship,
            parsed.relationship_code,
          );
        }
      } else {
        console.error(
          "[AnalyzeRelativeTool] LLM không trả về relationship_code hợp lệ; giữ quan hệ đã nhận diện từ câu.",
        );
      }
    } catch (error) {
      logSafeError(
        "[AnalyzeRelativeTool] LLM phân loại lỗi; giữ quan hệ đã nhận diện từ câu",
        error,
      );
    }

    const { relationship_code, name, dob, gender } = resolveRelativeAnalysis(
      explicitRelationship,
      parsed,
    );

    // Endpoint đúng là /relatives/patient/relatives (danh sách người thân của
    // chính user đang đăng nhập) — /relatives (không có path con) chỉ có
    // route POST để tạo mới, GET vào đó sẽ 404.
    //
    // Khi relationship_code là ban_than (bản thân — mặc định khi người dùng
    // không nhắc tới ai), KHÔNG gắn filter name: hồ sơ bản thân là duy nhất
    // (1 hồ sơ/1 user, được backend tự tạo sẵn lúc đăng ký — xem
    // auth.service.ts::register()), không cần và không nên lọc theo tên —
    // nếu LLM lỡ trích được một cái tên bất kỳ từ ngữ cảnh hội thoại (không
    // liên quan tới việc chọn người), lọc theo tên đó có thể khiến hồ sơ bản
    // thân bị bỏ sót dù vẫn tồn tại.
    const isSelf = relationship_code === "ban_than";
    const apiUrl =
      process.env.BACKEND_URL +
      `/api/v1/relatives/patient/relatives?relationshipCode=${encodeURIComponent(relationship_code)}${
        !isSelf && name ? `&search=${encodeURIComponent(name)}` : ""
      }&page=1&limit=20`;

    let relatives = [];
    let lookup_error = false;

    try {
      const response = await withRetry(
        () =>
          httpClient.get(apiUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        { operation: "relatives_lookup" },
      );
      // Response được bọc bởi PaginationResultDto: { data: { relatives: [...], total, page, limit } }
      relatives = response.data?.data?.relatives || [];
      console.log(
        `[AnalyzeRelativeTool] API trả về ${relatives.length} người thân khớp.`,
      );
    } catch (error) {
      lookup_error = true;
      logSafeError("[AnalyzeRelativeTool] Relatives lookup failed", error);
    }

    return { relatives, lookup_error, relationship_code, name, dob, gender };
  },
  {
    name: "analyze_relative_tool",
    description:
      "Phân tích văn bản để xác định mối quan hệ và truy vấn danh sách relativeId tương ứng.",
    schema: z.object({
      text_input: z
        .string()
        .describe(
          "Câu mô tả người thân tiếng Việt, ví dụ 'Tôi muốn đặt lịch cho bé Lan.'",
        ),
      token: z.string().describe("Token xác thực người dùng"),
    }),
  },
);
