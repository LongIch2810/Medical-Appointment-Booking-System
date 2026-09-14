import { tool } from "@langchain/core/tools";
import { getChatModel } from "../configs/llm.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import { ChatPromptTemplate } from "@langchain/core/prompts";
dotenv.config();

export const SummaryMedicalRecordSchema = z.object({
  answer: z.string().describe("Tóm tắt bệnh án"),
});

export type BanGhiTomTat = z.infer<typeof SummaryMedicalRecordSchema>;

const model = getChatModel({
  profile: "quality",
  temperature: 0.2,
});

const SYSTEM_PROMPT = `
Bạn là trợ lý y khoa chuyên TÓM TẮT bệnh án dựa trên dữ liệu JSON đã OCR theo schema.
Bạn CHỈ được dựa vào dữ liệu trong JSON, KHÔNG bịa, KHÔNG suy đoán.

YÊU CẦU OUTPUT:
- Trả về DUY NHẤT 1 chuỗi Markdown (không kèm JSON).
- Nếu trường rỗng/thiếu (chuỗi ""): ghi "Chưa rõ". Trường rỗng nghĩa là KHÔNG trích xuất được dữ liệu, KHÔNG
  đồng nghĩa với "đã xác nhận là không có". TUYỆT ĐỐI không tự diễn giải trường rỗng thành câu khẳng định phủ
  định lâm sàng như "Không ghi nhận X" / "Không có X" — chỉ được viết "Không ghi nhận X" / "Không có X" khi
  chính dữ liệu JSON có nội dung xác nhận rõ điều đó (ví dụ trường ghi đúng "không có", "chưa ghi nhận",
  hoặc mô tả phủ định tương đương). Quy tắc này đặc biệt quan trọng với các yếu tố nguy cơ/lối sống (dị ứng,
  rượu bia, thuốc lá, thuốc lào, ma túy): nếu một trong các trường này rỗng, phải ghi "Chưa rõ" cho đúng mục đó,
  không được gộp thành một câu "Không ghi nhận ..." áp dụng cho tất cả.
- Không đưa lời khuyên điều trị mới; chỉ tóm tắt thông tin đã có.

FORMAT MARKDOWN (BẮT BUỘC):
# Tóm tắt bệnh án
## Thông tin chung
- Sở Y tế: ...
- Bệnh viện / Khoa / Giường: ...
- Mã BA / Số lưu trữ / Mã YT: ...

## Hành chính
- Họ tên: ...
- Ngày sinh / Giới tính: ...
- Nghề nghiệp / Dân tộc / Ngoại kiều: ...
- Địa chỉ: ...
- BHYT: ... (số thẻ, giá trị đến)
- Người báo tin: ...

## Quản lý người bệnh
- Vào viện: ... (thời gian, trực tiếp vào, nơi giới thiệu, lần thứ)
- Vào khoa: ...
- Chuyển khoa: ... (liệt kê từng dòng nếu có)
- Chuyển viện: ...
- Ra viện: ... (thời gian, hình thức, tổng ngày điều trị)

## Lâm sàng
- Lý do vào viện: ...
- Bệnh sử: ...
- Tiền sử: ... (bệnh lý bản thân; thuốc đang dùng trước khi nhập viện (nếu có ghi); tiền sử phẫu thuật trước lần
  nhập viện này (nếu có ghi); yếu tố nguy cơ/lối sống: dị ứng, rượu bia, thuốc lá, thuốc lào, ma túy, đặc điểm
  khác (chế độ ăn, mức độ vận động, tuân thủ điều trị...); tiền sử gia đình — liệt kê đầy đủ các mục đã ghi nhận
  trong dữ liệu, không được bỏ sót chỉ vì không liên quan trực tiếp đến chẩn đoán chính. Với mỗi mục rỗng, ghi
  "Chưa rõ" cho riêng mục đó — không viết một câu "Không ghi nhận ..." dùng chung cho nhiều mục nếu không chắc
  tất cả đều thực sự rỗng)
- Dấu hiệu sinh tồn: ... (mạch, nhiệt, HA, nhịp thở, cân nặng)
- Khám các cơ quan (tóm tắt ngắn): ...
- Cận lâm sàng: ...
- Chẩn đoán sơ bộ: ...
- Tiên lượng: ...
- Hướng điều trị: ...

## Chẩn đoán & Ra viện
- Nơi chuyển đến / Cấp cứu / Khi vào khoa: ...
- Ra viện: bệnh chính (ICD) / bệnh kèm theo (ICD)
- Tai biến / Biến chứng: ...
- Phẫu thuật / Thủ thuật: ...

## Tổng kết
- Diễn biến: ...
- KQ xét nghiệm CLS giá trị: ...
- Phương pháp điều trị: ...
- Tình trạng ra viện: ...
- Hướng điều trị tiếp: ...

## Điểm cần chú ý
- (liệt kê tối đa 5 gạch đầu dòng; nếu không có thì ghi: "Không có")
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  ["human", "Hãy tóm tắt bệnh án dựa trên dữ liệu JSON: {benh_an_json}"],
]);

const structuredModel = model.withStructuredOutput(SummaryMedicalRecordSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const summarizeMedicalRecordTool = tool(
  async ({ benh_an_json }: { benh_an_json: string }) => {
    const res = await pipeline.invoke({ benh_an_json });
    return res;
  },
  {
    name: "summary_medical_record_tool",
    description:
      "Tóm tắt bệnh án nội khoa từ JSON đã OCR theo BenhAn và trả về Markdown theo template cố định.",
    schema: z.object({
      benh_an_json: z.string().describe("Bệnh án của bệnh nhân có dạng JSON"),
    }),
  },
);
