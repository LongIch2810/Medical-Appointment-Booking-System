import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";

dotenv.config();

const dateTimeSchema = z.object({
  appointment_date: z
    .string()
    .describe("Ngày đặt lịch theo định dạng YYYY-MM-DD. Ví dụ: 2025-08-28"),
  day_of_week: z.string().describe("Thứ trong tuần, Ví dụ: Tuesday"),
  start_time: z
    .string()
    .describe(
      "Thời gian bắt đầu khung giờ mà người dùng rảnh để đi khám. " +
        "Được sử dụng để hệ thống gợi ý các bác sĩ hoặc lịch khám phù hợp trong khoảng thời gian này. " +
        "Định dạng chuẩn HH:mm (giờ theo 24h). " +
        "Ví dụ: '09:00' nghĩa là người dùng rảnh bắt đầu từ 9 giờ sáng."
    ),
  end_time: z
    .string()
    .describe(
      "Thời gian kết thúc khung giờ mà người dùng rảnh để đi khám. " +
        "Hệ thống sẽ chỉ tìm các khung lịch bác sĩ phù hợp nằm trong khoảng từ 'start_time' đến 'end_time'. " +
        "Định dạng chuẩn HH:mm (giờ theo 24h). " +
        "Ví dụ: '11:00' nghĩa là người dùng rảnh đến 11 giờ trưa."
    ),
});

type DateTimeOutput = z.infer<typeof dateTimeSchema>;

const today = new Date();
const currentDate = today.toISOString().split("T")[0];

const systemPrompt = `
Bạn là hệ thống phân tích thời gian đặt lịch khám bệnh từ tiếng Việt.

Mục tiêu: Trích xuất chính xác 3 thông tin sau:
- appointment_date: Ngày đặt lịch theo định dạng YYYY-MM-DD
- start_time: Giờ bắt đầu theo định dạng HH:mm
- end_time: Giờ kết thúc theo định dạng HH:mm
- day_of_week: Thứ tương ứng với ngày đó

QUY TẮC BẮT BUỘC:
1. KHÔNG ĐƯỢC tự suy luận hoặc tự chọn ngày nếu người dùng KHÔNG nói rõ ngày (vd: "hôm nay", "ngày mai", "28/10", "thứ 3", "cuối tuần", v.v.)
2. Nếu không có thông tin rõ ràng về ngày → để appointment_date và day_of_week là chuỗi rỗng ("").
3. KHÔNG được tự cộng thêm ngày, KHÔNG được mặc định "ngày mai" nếu không có từ khoá chỉ thời gian.
4. Nếu chỉ nói “sáng”, “chiều”, “tối” mà KHÔNG có ngày cụ thể → chỉ điền start_time và end_time, để appointment_date trống.
5. Nếu nói “sáng mai” → chỉ được tính là ngày mai so với ngày hiện tại (${currentDate}), KHÔNG được tự bịa ngày khác.

Mặc định thời gian khung giờ:
- sáng → 08:00 - 12:00
- chiều → 13:00 - 17:00
- tối → 18:00 - 21:00

Nếu không có giờ cụ thể → để chuỗi rỗng.
Nếu không có thông tin nào hợp lệ → tất cả trường đều là chuỗi rỗng.

Trả về đúng định dạng schema, không tự thêm giả định.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["human", "Văn bản cần phân tích: {text_input}"],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(dateTimeSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const AnalyzeTimeTool = tool(
  async ({ text_input }: { text_input: string }) => {
    const result = await pipeline.invoke({ text_input });
    return result;
  },
  {
    name: "analyze_time_tool",
    description:
      "Phân tích văn bản để xác định thời gian đặt lịch khám tương ứng.",
    schema: z.object({
      text_input: z
        .string()
        .describe(
          "Câu mô tả thời gian đặt lịch khám tiếng Việt, ví dụ 'Tôi muốn đặt lịch khám vào sáng mai.'"
        ),
    }),
  }
);
