import * as dotenv from "dotenv";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { extractImgUrl } from "../utils/extractImgUrl.js";

dotenv.config();

// 1. Phần Đầu trang (Header)
const HeaderSchema = z.object({
  so_y_te: z.string().describe("Tên Sở Y tế"),
  benh_vien: z.string().describe("Tên bệnh viện"),
  khoa: z.string().describe("Tên khoa"),
  giuong: z.string().describe("Số giường"),
  ma_so_benh_an: z.string().describe("Mã số hồ sơ (MS: 01/BV-01)"),
  so_luu_tru: z.string().describe("Số lưu trữ"),
  ma_yt: z.string().describe("Mã Y Tế"),
});

// 2. Phần I - Hành chính
const HanhChinhSchema = z.object({
  ho_ten: z.string().describe("Họ và tên bệnh nhân (In hoa)"),
  ngay_sinh: z.string().describe("Ngày sinh hoặc tuổi"),
  gioi_tinh: z.string().describe("Giới tính"),
  nghe_nghiep: z.string().describe("Nghề nghiệp"),
  dan_toc: z.string().describe("Dân tộc"),
  ngoai_kieu: z.string().describe("Ngoại kiều (Quốc tịch)"),
  dia_chi: z.object({
    chi_tiet: z.string().describe("Số nhà, thôn, xóm"),
    huyen_quan: z.string().describe("Huyện (Quận, Tx)"),
    tinh_thanh: z.string().describe("Tỉnh, thành phố"),
  }),
  noi_lam_viec: z.string().describe("Nơi làm việc"),
  doi_tuong: z.string().describe("Đối tượng (1.BHYT, 2.Thu phí, 3.Miễn)"),
  bao_hiem_y_te: z.object({
    gia_tri_den: z.string().describe("BHYT giá trị đến ngày"),
    so_the: z.string().describe("Số thẻ BHYT"),
  }),
  nguoi_bao_tin: z.object({
    ho_ten_dia_chi: z.string().describe("Họ tên, địa chỉ người nhà"),
    so_dien_thoai: z.string().describe("Số điện thoại người nhà"),
  }),
});

// 3. Phần II - Quản lý người bệnh
const QuanLyNguoiBenhSchema = z.object({
  vao_vien: z.object({
    thoi_gian: z.string().describe("Thời gian vào viện (Giờ, ngày)"),
    truc_tiep_vao: z
      .string()
      .describe("Trực tiếp vào (Cấp cứu/KKB/Khoa điều trị)"),
    noi_gioi_thieu: z.string().describe("Nơi giới thiệu"),
    lan_thu: z.string().describe("Vào viện do bệnh này lần thứ"),
  }),
  vao_khoa: z.string().describe("Thời gian vào khoa"),
  chuyen_khoa: z
    .array(
      z.object({
        khoa: z.string().describe("Tên khoa chuyển đến"),
        thoi_gian: z.string().describe("Thời gian chuyển khoa"),
      })
    )
    .describe("Lịch sử chuyển khoa"),
  chuyen_vien: z.object({
    loai_chuyen: z.string().describe("Chuyển viện (Tuyến trên/dưới/CK)"),
    noi_den: z.string().describe("Tên nơi chuyển đến"),
  }),
  ra_vien: z.object({
    thoi_gian: z.string().describe("Thời gian ra viện"),
    hinh_thuc: z.string().describe("Ra viện/Xin về/Bỏ về/Đưa về"),
    tong_so_ngay_dieu_tri: z.string().describe("Tổng số ngày điều trị"),
  }),
});

// 4. Phần III - Chẩn đoán (Bao gồm cả mã ICD)
const ChanDoanSchema = z.object({
  noi_chuyen_den: z.object({
    ten_benh: z.string().describe("Chẩn đoán nơi chuyển đến"),
    ma: z.string().describe("Mã bệnh nơi chuyển đến"),
  }),
  kkb_cap_cuu: z.object({
    ten_benh: z.string().describe("Chẩn đoán KKB, Cấp cứu"),
    ma: z.string().describe("Mã bệnh KKB, Cấp cứu"),
  }),
  khi_vao_khoa: z.object({
    ten_benh: z.string().describe("Chẩn đoán khi vào khoa điều trị"),
    ma: z.string().describe("Mã bệnh khi vào khoa"),
  }),
  ra_vien: z.object({
    benh_chinh: z.object({
      ten_benh: z.string().describe("Bệnh chính ra viện"),
      ma: z.string().describe("Mã bệnh chính"),
    }),
    benh_kem_theo: z.object({
      ten_benh: z.string().describe("Bệnh kèm theo"),
      ma: z.string().describe("Mã bệnh kèm theo"),
    }),
    tai_bien: z.string().describe("Tai biến"),
    bien_chung: z.string().describe("Biến chứng"),
  }),
  phau_thuat_thu_thuat: z.string().describe("Thông tin Phẫu thuật/Thủ thuật"),
});

// 5. Phần IV - Tình trạng ra viện
const TinhTrangRaVienSchema = z.object({
  ket_qua_dieu_tri: z
    .string()
    .describe("Kết quả (Khỏi/Đỡ/Không đổi/Nặng hơn/Tử vong)"),
  giai_phau_benh: z
    .string()
    .describe("Giải phẫu bệnh (Lành tính/Nghi ngờ/Ác tính)"),
  tu_vong: z.object({
    thoi_gian: z.string().describe("Thời gian tử vong"),
    nguyen_nhan_chinh: z.string().describe("Nguyên nhân chính tử vong"),
    kham_nghiem_tu_thi: z.string().describe("Khám nghiệm tử thi (Có/Không)"),
    chan_doan_giai_phau: z.string().describe("Chẩn đoán giải phẫu tử thi"),
  }),
});

// 6. Phần A - Bệnh án (Lâm sàng)
const LamSangSchema = z.object({
  ly_do_vao_vien: z.string().describe("Lý do vào viện"),
  hoi_benh: z.object({
    qua_trinh_benh_ly: z.string().describe("Quá trình bệnh lý"),
    tien_su: z.object({
      ban_than: z.string().describe("Tiền sử bản thân"),
      dac_diem_lien_quan: z.object({
        di_ung: z.string().describe("Dị ứng (thời gian)"),
        ma_tuy: z.string().describe("Ma túy (thời gian)"),
        ruou_bia: z.string().describe("Rượu bia (thời gian)"),
        thuoc_la: z.string().describe("Thuốc lá (thời gian)"),
        thuoc_lao: z.string().describe("Thuốc lào (thời gian)"),
        khac: z.string().describe("Đặc điểm khác"),
      }),
      gia_dinh: z.string().describe("Tiền sử gia đình"),
    }),
  }),
  kham_benh: z.object({
    toan_than: z.object({
      mach: z.string().describe("Mạch (lần/ph)"),
      nhiet_do: z.string().describe("Nhiệt độ (độ C)"),
      huyet_ap: z.string().describe("Huyết áp (mmHg)"),
      nhip_tho: z.string().describe("Nhịp thở (lần/ph)"),
      can_nang: z.string().describe("Cân nặng (kg)"),
      mo_ta_chung: z.string().describe("Mô tả khám toàn thân"),
    }),
    cac_co_quan: z.object({
      tuan_hoan: z.string().describe("Khám tuần hoàn"),
      ho_hap: z.string().describe("Khám hô hấp"),
      tieu_hoa: z.string().describe("Khám tiêu hóa"),
      than_tiet_nieu: z.string().describe("Khám Thận - Tiết niệu - Sinh dục"),
      than_kinh: z.string().describe("Khám Thần kinh"),
      co_xuong_khop: z.string().describe("Khám Cơ - Xương - Khớp"),
      tai_mui_hong: z.string().describe("Khám Tai - Mũi - Họng"),
      rang_ham_mat: z.string().describe("Khám Răng - Hàm - Mặt"),
      mat: z.string().describe("Khám Mắt"),
      noi_tiet_khac: z.string().describe("Khám Nội tiết và các bệnh lý khác"),
    }),
  }),
  can_lam_sang: z.string().describe("Các xét nghiệm cận lâm sàng cần làm"),
  tom_tat_benh_an: z.string().describe("Tóm tắt bệnh án"),
  chan_doan_so_bo: z.object({
    benh_chinh: z.string().describe("Chẩn đoán bệnh chính"),
    benh_kem_theo: z.string().describe("Chẩn đoán bệnh kèm theo"),
    phan_biet: z.string().describe("Chẩn đoán phân biệt"),
  }),
  tien_luong: z.string().describe("Tiên lượng"),
  huong_dieu_tri: z.string().describe("Hướng điều trị"),
});

// 7. Phần B - Tổng kết bệnh án
const TongKetSchema = z.object({
  qua_trinh_dien_bien: z
    .string()
    .describe("Quá trình bệnh lý và diễn biến lâm sàng"),
  tom_tat_kq_xet_nghiem: z
    .string()
    .describe("Tóm tắt kết quả xét nghiệm CLS có giá trị"),
  phuong_phap_dieu_tri: z.string().describe("Phương pháp điều trị"),
  tinh_trang_ra_vien: z.string().describe("Tình trạng người bệnh ra viện"),
  huong_dieu_tri_tiep: z
    .string()
    .describe("Hướng điều trị và chế độ tiếp theo"),
  ho_so_luu: z.object({
    x_quang: z.string().describe("Số tờ X-quang"),
    ct_scanner: z.string().describe("Số tờ CT Scanner"),
    sieu_am: z.string().describe("Số tờ Siêu âm"),
    xet_nghiem: z.string().describe("Số tờ Xét nghiệm"),
    khac: z.string().describe("Số tờ Khác"),
    toan_bo_ho_so: z.string().describe("Tổng số tờ hồ sơ"),
  }),
  nguoi_giao_ho_so: z.string().describe("Họ tên người giao hồ sơ"),
  nguoi_nhan_ho_so: z.string().describe("Họ tên người nhận hồ sơ"),
  bac_si_dieu_tri: z.string().describe("Họ tên bác sĩ điều trị ký tên"),
});

export const BenhAnSchema = z.object({
  thong_tin_chung: HeaderSchema,
  hanh_chinh: HanhChinhSchema,
  quan_ly_nguoi_benh: QuanLyNguoiBenhSchema,
  chan_doan: ChanDoanSchema,
  tinh_trang_ra_vien: TinhTrangRaVienSchema,
  benh_an: LamSangSchema,
  tong_ket: TongKetSchema,
});

export type BenhAn = z.infer<typeof BenhAnSchema>;

const visionLLM = new ChatGoogleGenerativeAI({
  model: process.env.OCR_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredOutput = visionLLM.withStructuredOutput(BenhAnSchema);

const SystemPrompt = `
Bạn là hệ thống OCR (Optical Character Recognition) chuyên trích xuất dữ liệu từ hồ sơ bệnh án nội khoa (ảnh hoặc PDF).
Bạn CHỈ được làm nhiệm vụ OCR + trích xuất đúng theo schema đã cung cấp. Không làm bất kỳ nhiệm vụ nào khác.

MỤC TIÊU DUY NHẤT:
- Đọc nội dung trong tài liệu và trả về JSON khớp schema (đúng cấu trúc, đúng kiểu dữ liệu).
- Không giải thích, không tóm tắt, không nhận xét, không suy luận, không đưa lời khuyên y khoa.

QUY TẮC BẮT BUỘC:
1) Chỉ trích xuất những gì THỰC SỰ nhìn thấy trong tài liệu. TUYỆT ĐỐI không bịa/điền theo “logic”.
2) Nếu một trường có nhãn/ô điền nhưng KHÔNG có chữ viết/không có dữ liệu được ghi vào (ô trống):
   -> Trả về "" (chuỗi rỗng).
3) Nếu thông tin có nhưng bị mờ/không đọc rõ:
   -> Giữ nguyên phần đọc được và thay phần không đọc được bằng token "[mờ]" đúng vị trí.
   Ví dụ: "Nguyễn Văn [mờ]", "[mờ] Văn A", "12/[mờ]/2025".
4) Giữ nguyên định dạng gốc (ngày/giờ/số/đơn vị/viết tắt/dấu câu). Không tự chuẩn hoá hay đổi format.
5) Nếu có nhiều trang: tổng hợp tất cả trang, tránh trùng lặp; nếu có xung đột, ưu tiên giá trị rõ ràng hơn hoặc xuất hiện ở phần tổng kết/ra viện.
6) Không thêm bất kỳ khóa (key) nào ngoài schema. Không đổi tên key. Không bỏ thiếu cấu trúc.
7) Output cuối cùng: CHỈ trả về JSON theo schema. Không kèm markdown, không kèm text ngoài JSON.

CÁCH LÀM:
- Quét toàn bộ tài liệu.
- Ghép thông tin theo đúng vị trí/nhãn của form tương ứng với schema.
- Điền giá trị chính xác vào từng trường.
- Ô trống => "" ; chữ mờ => dùng "[mờ]".
`;

const normalizedArrSchema = z
  .array(
    z.object({
      mimetype: z.string(),
      base64: z.string(),
    })
  )
  .min(1);
type NormalizedArr = z.infer<typeof normalizedArrSchema>;
export const ocrTool = tool(
  async (normalizedArr: NormalizedArr) => {
    const parts = normalizedArr.map((i) => ({
      type: "image_url",
      image_url: extractImgUrl(i),
    }));
    const input = [
      new SystemMessage(SystemPrompt),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: "Trích xuất thông tin bệnh án từ các file hình ảnh hoặc file pdf sau:",
          },
          ...parts,
        ],
      }),
    ];
    const result = await structuredOutput.invoke(input);
    return result;
  },
  {
    name: "ocr_tool",
    description:
      "Nhận dạng ký tự quang học (OCR)/Trích xuất hồ sơ y tế có cấu trúc từ hình ảnh hoặc tệp PDF bằng Gemini.",
    schema: normalizedArrSchema,
  }
);
