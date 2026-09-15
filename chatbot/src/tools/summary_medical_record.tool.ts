import * as dotenv from "dotenv";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getChatModel } from "../configs/llm.js";

dotenv.config();

export const SummaryMedicalRecordSchema = z.object({
  answer: z.string().describe("Tóm tắt bệnh án"),
});

export type BanGhiTomTat = z.infer<typeof SummaryMedicalRecordSchema>;

const SummaryFactSchema = z.object({
  nhan: z
    .string()
    .min(1)
    .describe("Nhãn ngắn cho dữ kiện, không chứa ký hiệu Markdown"),
  noi_dung: z
    .string()
    .min(1)
    .describe("Nội dung trung thành với JSON, không thêm diễn giải mới"),
  duong_dan_nguon: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Tất cả đường dẫn tới trường giá trị cuối trong JSON, ví dụ hanh_chinh.ho_ten hoặc dieu_tri_chi_tiet.thuoc_ra_vien[0].ten",
    ),
});

const SummaryAttentionSchema = z.object({
  noi_dung: z.string().min(1),
  duong_dan_nguon: z.array(z.string().min(1)).min(1),
});

export const MedicalRecordSummarySectionsSchema = z.object({
  thong_tin_tai_lieu_va_nguoi_benh: z.array(SummaryFactSchema),
  dot_kham_dieu_tri: z.array(SummaryFactSchema),
  lam_sang: z.array(SummaryFactSchema),
  can_lam_sang: z.array(SummaryFactSchema),
  chan_doan: z.array(SummaryFactSchema),
  dieu_tri: z.array(SummaryFactSchema),
  tinh_trang_va_ke_hoach: z.array(SummaryFactSchema),
  diem_can_chu_y: z.array(SummaryAttentionSchema).max(7),
});

export type MedicalRecordSummarySections = z.infer<
  typeof MedicalRecordSummarySectionsSchema
>;

const model = getChatModel({
  profile: "quality",
  temperature: 0,
});

export const SUMMARY_SYSTEM_PROMPT = `
Bạn là trợ lý y khoa tóm tắt hồ sơ y tế từ JSON đã được OCR. JSON có thể đến từ nhiều loại tài liệu và nhiều
mẫu của các cơ sở khác nhau. Chỉ dùng dữ liệu có trong JSON; không chẩn đoán thêm, không suy diễn, không tính
giá trị mới và không đưa ra hướng điều trị mới.

QUY TẮC BẰNG CHỨNG:
1. Mỗi dữ kiện phải có duong_dan_nguon trỏ chính xác tới tất cả trường JSON làm căn cứ. Dùng cú pháp dấu chấm
   và chỉ số mảng, ví dụ hanh_chinh.ho_ten, benh_an.kham_benh.toan_than.nhiet_do hoặc
   dieu_tri_chi_tiet.thuoc_ra_vien[0].ten. Không tạo dữ kiện nếu không chỉ ra được
   trường nguồn có giá trị. Đường dẫn phải kết thúc ở giá trị chuỗi/số/boolean, không trỏ tới cả object hay mảng.
   Mọi đường dẫn phải đồng thời tồn tại trong bang_chung_ocr; mọi số trong noi_dung phải xuất hiện trong các
   trường nguồn được dẫn chiếu. Không dùng nội dung của bang_chung_ocr như một dữ kiện độc lập.
2. Chuỗi "" và mảng [] là không có dữ liệu. Không biến chúng thành "không có", "bình thường" hay "chưa rõ".
   Không tạo dòng chỉ để báo một trường trống; một phần hoàn toàn trống sẽ được hệ thống xử lý.
3. Giữ nguyên mức độ chắc chắn và phủ định. "Chưa nghe âm thổi" không được đổi thành "không âm thổi";
   "nghi", "có thể", "chưa ghi nhận" và các mốc thời gian phải được bảo toàn.
4. Không đổi vai trò dữ liệu. Mã hồ sơ, mã bệnh nhân, mã bệnh án, số vào viện và mã mẫu biểu phải tách riêng;
   tiền sử thuốc không phải thuốc của đợt điều trị; tiền sử phẫu thuật không phải can thiệp hiện tại.
5. Không coi logo, thương hiệu hoặc chữ đầu trang là tên bệnh viện nếu JSON không có trường benh_vien rõ ràng.
   Không dùng ngày nhập viện, ngày xét nghiệm hoặc ngày ra viện làm ngày lập tài liệu.
6. Nếu các nguồn mâu thuẫn, nêu rằng tài liệu không thống nhất và dẫn chiếu cả hai nguồn; không tự chọn một
   phiên bản. Không lặp cùng một dữ kiện ở nhiều dòng hoặc nhiều phần.

YÊU CẦU ĐẦY ĐỦ:
- Thông tin tài liệu/người bệnh: loại tài liệu, cơ sở/khoa, người lập và các mã định danh đúng nhãn; họ tên,
  ngày sinh/tuổi, giới tính, liên hệ, bảo hiểm, nhóm máu khi có.
- Đợt khám/điều trị: mọi mốc tiếp nhận, vào viện, vào khoa, chuyển khoa/chuyển viện, ra viện và số ngày nếu được
  ghi trực tiếp.
- Lâm sàng: lý do, bệnh sử, tiền sử, dị ứng, thuốc trước viện, yếu tố nguy cơ, toàn bộ sinh hiệu có giá trị
  (kể cả nhiệt độ, SpO2, chiều cao, cân nặng, BMI, mức đau), khám, diễn biến và phân tầng nguy cơ được ghi.
- Cận lâm sàng: kết quả quan trọng, đơn vị, khoảng tham chiếu, thời điểm và kết luận hình ảnh/thăm dò đã ghi.
- Chẩn đoán: tách theo thời điểm/vai trò và ghép đúng mã ICD với tên tương ứng.
- Điều trị: tách thuốc trước viện, thuốc trong viện và thuốc ra viện; giữ hàm lượng, liều, đường dùng, tần suất, thời gian,
  cảnh báo; nêu thủ thuật và điều trị không dùng thuốc khi có.
- Tình trạng/kế hoạch: diễn biến đến ra viện, lịch tái khám, xét nghiệm theo dõi, hướng dẫn và dấu hiệu cấp cứu.
- Điểm cần chú ý: tối đa 7 ý có căn cứ, ưu tiên dị ứng, cảnh báo, bất thường quan trọng, thay đổi thuốc, việc cần
  làm sau ra viện và mâu thuẫn. Không tự tạo khuyến cáo.
- Dùng thong_tin_bo_sung cho nội dung mẫu lạ và xếp vào phần gần nghĩa nhất.

Trả về đúng object theo schema các phần. Không viết Markdown trong nhan/noi_dung và không kèm lời giải thích.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", SUMMARY_SYSTEM_PROMPT],
  [
    "human",
    "Hãy lập các phần tóm tắt bệnh án dựa trên dữ liệu JSON: {benh_an_json}",
  ],
]);

const structuredModel = model.withStructuredOutput(
  MedicalRecordSummarySectionsSchema,
);

const pipeline = promptTemplate.pipe(structuredModel);

const SECTION_HEADINGS: Array<
  [keyof Omit<MedicalRecordSummarySections, "diem_can_chu_y">, string]
> = [
  ["thong_tin_tai_lieu_va_nguoi_benh", "Thông tin tài liệu và người bệnh"],
  ["dot_kham_dieu_tri", "Đợt khám/điều trị"],
  ["lam_sang", "Lâm sàng"],
  ["can_lam_sang", "Cận lâm sàng"],
  ["chan_doan", "Chẩn đoán"],
  ["dieu_tri", "Điều trị"],
  ["tinh_trang_va_ke_hoach", "Tình trạng và kế hoạch tiếp theo"],
];

const normalizeForDeduplication = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

const getValueAtPath = (source: unknown, path: string): unknown => {
  const segments = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);

  let current = source;
  for (const segment of segments) {
    if (
      segment === "__proto__" ||
      segment === "prototype" ||
      segment === "constructor" ||
      current === null ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

const hasSourceValue = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  return typeof value === "number" || typeof value === "boolean";
};

const extractNumericTokens = (value: string) =>
  (value.match(/\d+(?:[.,]\d+)*/g) ?? []).map((token) =>
    token.replace(",", "."),
  );

const hasValidEvidence = (
  paths: string[],
  source: unknown,
  content: string,
  verifiedOcrPaths: ReadonlySet<string>,
) => {
  const sourceValues = paths.map((path) => getValueAtPath(source, path));
  if (
    paths.length === 0 ||
    !paths.every((path) => verifiedOcrPaths.has(path)) ||
    !sourceValues.every(hasSourceValue)
  ) {
    return false;
  }

  const sourceNumbers = new Set(
    extractNumericTokens(sourceValues.map(String).join(" ")),
  );
  return extractNumericTokens(content).every((token) =>
    sourceNumbers.has(token),
  );
};

export const renderMedicalRecordSummary = (
  sections: MedicalRecordSummarySections,
  source: unknown,
): string => {
  const output = ["# Tóm tắt bệnh án"];
  const seenFacts = new Set<string>();
  const verifiedOcrPaths = new Set(
    (
      getValueAtPath(source, "bang_chung_ocr") as
        | Array<{ duong_dan?: unknown }>
        | undefined
    )
      ?.map((item) =>
        typeof item.duong_dan === "string" ? item.duong_dan.trim() : "",
      )
      .filter(Boolean) ?? [],
  );

  for (const [key, heading] of SECTION_HEADINGS) {
    output.push("", `## ${heading}`, "");
    const lines: string[] = [];

    for (const fact of sections[key]) {
      const label = fact.nhan.trim().replace(/^[-#*\s]+/, "");
      const content = fact.noi_dung.trim();
      const dedupeKey = normalizeForDeduplication(`${label}: ${content}`);
      if (
        !label ||
        !content ||
        seenFacts.has(dedupeKey) ||
        !hasValidEvidence(
          fact.duong_dan_nguon,
          source,
          content,
          verifiedOcrPaths,
        )
      ) {
        continue;
      }
      seenFacts.add(dedupeKey);
      lines.push(`- ${label}: ${content}`);
    }

    output.push(
      ...(lines.length > 0
        ? lines
        : ["- Không có dữ liệu trong tài liệu"]),
    );
  }

  output.push("", "## Điểm cần chú ý", "");
  const attentionLines: string[] = [];
  const seenAttention = new Set<string>();
  for (const item of sections.diem_can_chu_y.slice(0, 7)) {
    const content = item.noi_dung.trim().replace(/^[-#*\s]+/, "");
    const key = normalizeForDeduplication(content);
    if (
      !content ||
      seenAttention.has(key) ||
      !hasValidEvidence(
        item.duong_dan_nguon,
        source,
        content,
        verifiedOcrPaths,
      )
    ) {
      continue;
    }
    seenAttention.add(key);
    attentionLines.push(`- ${content}`);
  }
  output.push(
    ...(attentionLines.length > 0
      ? attentionLines
      : ["- Không có dữ liệu trong tài liệu"]),
  );

  return output.join("\n");
};

export const summarizeMedicalRecordTool = tool(
  async ({ benh_an_json }: { benh_an_json: string }) => {
    const source = JSON.parse(benh_an_json) as unknown;
    const sections = await pipeline.invoke({ benh_an_json });
    return {
      answer: renderMedicalRecordSummary(sections, source),
    };
  },
  {
    name: "summary_medical_record_tool",
    description:
      "Tóm tắt hồ sơ y tế từ JSON OCR, kiểm tra dẫn chiếu nguồn và trả về Markdown theo cấu trúc ổn định.",
    schema: z.object({
      benh_an_json: z.string().describe("Bệnh án của bệnh nhân có dạng JSON"),
    }),
  },
);
