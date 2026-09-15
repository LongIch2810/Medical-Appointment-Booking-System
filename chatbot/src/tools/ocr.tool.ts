import * as dotenv from "dotenv";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getVisionModel } from "../configs/llm.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { extractImgUrl } from "../utils/extractImgUrl.js";

dotenv.config();

// 1. Phần Đầu trang (Header)
const HeaderSchema = z.object({
  so_y_te: z
    .string()
    .describe(
      "Tên Sở Y tế/cơ quan y tế cấp trên — dạng TÊN cơ quan (chữ), KHÔNG phải mã số/ID. Không lấy bất kỳ mã hồ " +
        "sơ, mã bệnh nhân, hay mã định danh nào khác điền vào đây dù không có tên cơ quan y tế nào được ghi.",
    ),
  benh_vien: z.string().describe("Tên bệnh viện"),
  khoa: z.string().describe("Tên khoa"),
  giuong: z.string().describe("Số giường"),
  ma_so_benh_an: z
    .string()
    .describe(
      "Mã số MẪU của biểu mẫu bệnh án in sẵn trên form (vd 'Mẫu số: 01/BV-01') — KHÔNG phải mã hồ sơ/mã bệnh " +
        "án/mã bệnh nhân riêng của từng bệnh nhân. Nếu tài liệu chỉ có một mã định danh chung của hồ sơ hoặc " +
        "bệnh nhân (vd 'Mã hồ sơ: ...', 'Mã bệnh nhân: ...') mà không phải mã mẫu form in sẵn, để trống ''.",
    ),
  so_luu_tru: z
    .string()
    .describe(
      "Số lưu trữ hồ sơ tại kho lưu trữ của bệnh viện — chỉ điền khi tài liệu có ghi riêng mục này, không lấy " +
        "mã hồ sơ/mã bệnh nhân thay thế",
    ),
  ma_yt: z
    .string()
    .describe(
      "Mã Y tế do cơ sở y tế cấp — chỉ điền khi tài liệu có ghi riêng mục này, không lấy mã hồ sơ/mã bệnh nhân " +
        "thay thế",
    ),
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
  vao_khoa: z
    .string()
    .describe(
      "Thời gian vào khoa — CHỈ điền nếu tài liệu có mục 'vào khoa' ghi thời gian riêng biệt với 'vào viện'; " +
        "không tự lấy lại giá trị của 'vào viện' hay 'ra viện' khi không có mục này",
    ),
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
    tong_so_ngay_dieu_tri: z
      .string()
      .describe(
        "Tổng số ngày điều trị — CHỈ điền nếu tài liệu ghi thẳng con số này bằng chữ/số; " +
          "KHÔNG tự tính bằng cách trừ ngày ra viện cho ngày vào viện",
      ),
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
    .describe(
      "Kết quả (chỉ chọn 1 trong 5 nhãn: Khỏi/Đỡ/Không đổi/Nặng hơn/Tử vong) — CHỈ chọn khi tài liệu diễn đạt " +
        "đủ rõ để khớp chắc chắn với đúng 1 nhãn (vd tài liệu dùng đúng từ đó, hoặc mô tả không thể hiểu khác " +
        "được); nếu mô tả chung chung/mơ hồ hoặc có thể khớp nhiều hơn 1 nhãn, để trống '' thay vì đoán",
    ),
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
      ban_than: z
        .string()
        .describe("Tiền sử bệnh lý nền của bản thân (nếu tài liệu có ghi)"),
      thuoc_dang_dung_truoc_nhap_vien: z
        .string()
        .describe(
          "Thuốc đang dùng trước khi nhập viện: tên thuốc, liều dùng, mức độ tuân thủ nếu tài liệu có ghi",
        ),
      tien_su_phau_thuat: z
        .string()
        .describe(
          "Tiền sử phẫu thuật/thủ thuật đã thực hiện TRƯỚC lần nhập viện này (khác với mục phẫu thuật/thủ thuật " +
            "trong lần điều trị hiện tại ở phần chẩn đoán), kèm thời gian nếu tài liệu có ghi",
        ),
      dac_diem_lien_quan: z.object({
        di_ung: z
          .string()
          .describe(
            "Dị ứng, kèm mô tả thời gian/mức độ nếu tài liệu có ghi (giữ nguyên văn, không phải bắt buộc là một ngày tháng cụ thể)",
          ),
        ma_tuy: z
          .string()
          .describe(
            "Sử dụng ma túy, kèm tần suất/thời lượng nếu tài liệu có ghi (vd: '3-4 lần/tuần', '10 năm') — không phải bắt buộc là một ngày tháng cụ thể",
          ),
        ruou_bia: z
          .string()
          .describe(
            "Uống rượu bia, kèm tần suất/thời lượng nếu tài liệu có ghi (vd: '3-4 lần/tuần') — không phải bắt buộc là một ngày tháng cụ thể",
          ),
        thuoc_la: z
          .string()
          .describe(
            "Hút thuốc lá, kèm tần suất/thời lượng nếu tài liệu có ghi (vd: '10 điếu/ngày trong 25 năm') — không phải bắt buộc là một ngày tháng cụ thể",
          ),
        thuoc_lao: z
          .string()
          .describe(
            "Hút thuốc lào, kèm tần suất/thời lượng nếu tài liệu có ghi — không phải bắt buộc là một ngày tháng cụ thể",
          ),
        khac: z
          .string()
          .describe(
            "Đặc điểm khác (vd: chế độ ăn, mức độ vận động, các yếu tố nguy cơ khác nếu tài liệu có ghi)",
          ),
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
    .describe(
      "Tóm tắt các kết quả xét nghiệm/cận lâm sàng có giá trị (số liệu, chỉ số, hình ảnh, kết luận thăm dò chức " +
        "năng...) — CHỈ chứa kết quả xét nghiệm, KHÔNG chứa tên chẩn đoán/bệnh (chẩn đoán đã có ở phần chan_doan " +
        "riêng, không lặp lại ở đây)",
    ),
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

const visionLLM = getVisionModel({ temperature: 0 });

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
8) TUYỆT ĐỐI không lấy giá trị của một trường/nhãn khác (dù cùng chủ đề hoặc đứng gần nhau) để điền thay cho
   trường đang xét, kể cả khi có vẻ liên quan. Chỉ điền đúng loại dữ liệu và đúng đơn vị theo mô tả (description)
   của chính trường đó.
   Ví dụ SAI: tài liệu không có mục "Vào khoa" riêng mà chỉ có "Ngày vào viện"/"Ngày ra viện" -> KHÔNG được lấy
   giờ ra viện điền vào trường "Vào khoa". Tài liệu chỉ ghi BMI (kg/m²), không ghi cân nặng (kg) -> KHÔNG được
   lấy giá trị BMI điền vào trường "Cân nặng (kg)".
   Ví dụ SAI cụ thể (đã xảy ra thật, PHẢI tránh lặp lại): tài liệu ghi "Mã hồ sơ: DEMO-MR-2026-001" và
   "Mã bệnh nhân: DEMO-PAT-001" — đây KHÔNG phải mã mẫu form in sẵn, cũng KHÔNG phải tên Sở Y tế.
   -> so_y_te PHẢI là "" (không được là "DEMO-MR-2026-001" hay "DEMO-PAT-001").
   -> ma_so_benh_an PHẢI là "" (không được là "DEMO-MR-2026-001" hay "DEMO-PAT-001").
   Việc tài liệu có 2 chuỗi mã số này không có nghĩa là chúng thuộc về "Sở Y tế" hay "Mã số hồ sơ (MS: 01/BV-01)"
   — nếu tài liệu không có mã mẫu form / tên cơ quan y tế viết rõ ràng, hai trường này PHẢI để trống, kể cả khi
   điều đó khiến JSON có nhiều trường rỗng.
   -> Nếu tài liệu không có đúng dữ liệu cho trường đang xét, trả về "" theo quy tắc 2, dù trường khác có dữ liệu
   trông có vẻ dùng thay được.
9) TUYỆT ĐỐI không tự tính toán, suy diễn hay quy đổi để tạo ra một giá trị mà tài liệu không ghi thẳng ra bằng
   chữ/số cụ thể. Cụ thể:
   - KHÔNG tự tính "tổng số ngày điều trị" bằng cách trừ ngày ra viện cho ngày vào viện nếu tài liệu không ghi
     thẳng con số đó — để trống "". Ví dụ: tài liệu ghi "Ngày vào viện: 10/09/2026" và "Ngày ra viện: 13/09/2026"
     nhưng KHÔNG có dòng nào ghi thẳng "Tổng số ngày điều trị: ..." bằng chữ/số -> bắt buộc trả về "" cho trường
     này; TUYỆT ĐỐI không tự trừ ngày để suy ra bất kỳ con số nào (3, 4, 5, ...) rồi điền vào.
   - KHÔNG tự gán giá trị "vào khoa" bằng ngày/giờ "vào viện" (hay bất kỳ mốc thời gian nào khác) khi tài liệu
     không có mục "vào khoa" ghi thời gian riêng — để trống "".
   - Với các trường mà mô tả (description) yêu cầu chọn 1 trong danh sách nhãn chuẩn (vd "Khỏi/Đỡ/Không đổi/
     Nặng hơn/Tử vong"): chỉ chọn nhãn khi tài liệu diễn đạt đủ rõ để khớp chắc chắn với đúng 1 nhãn; nếu mô tả
     trong tài liệu chung chung/mơ hồ hoặc có thể khớp nhiều hơn 1 nhãn, để trống "" thay vì tự suy ra.
   - Ví dụ SAI cụ thể (đã xảy ra thật, PHẢI tránh lặp lại): trường tom_tat_kq_xet_nghiem KHÔNG được điền câu
     dạng "Chẩn đoán đau thắt ngực ổn định nghi do bệnh động mạch vành, tăng huyết áp..." (đây là NỘI DUNG CHẨN
     ĐOÁN, thuộc về phần chan_doan, không phải kết quả xét nghiệm) — trường này chỉ được chứa số liệu/kết quả
     xét nghiệm và cận lâm sàng (vd "Troponin hs không tăng, ECG không ST chênh lên, siêu âm tim EF 62%..."),
     TUYỆT ĐỐI không chứa tên bệnh/chẩn đoán dù đúng là kết luận từ các xét nghiệm đó.
   NGOẠI LỆ của quy tắc 9: các trường có mô tả yêu cầu "tóm tắt"/"tổng hợp" (vd: tom_tat_benh_an,
   tom_tat_kq_xet_nghiem, qua_trinh_dien_bien, phuong_phap_dieu_tri, tinh_trang_ra_vien, huong_dieu_tri_tiep)
   ĐƯỢC PHÉP tổng hợp/diễn giải lại thông tin đã có ở nơi khác trong CHÍNH tài liệu này (vd tóm tắt bảng thuốc
   thành câu văn, gộp các dòng xét nghiệm bất thường thành 1 đoạn) — đó là đúng nhiệm vụ tóm tắt của trường đó,
   KHÔNG phải suy diễn/bịa. Ranh giới: được tổng hợp lại sự kiện/số liệu đã có trong tài liệu; TUYỆT ĐỐI không
   được thêm sự kiện, số liệu, hay kết luận nào không có trong tài liệu.

CÁCH LÀM:
- Quét toàn bộ tài liệu.
- Ghép thông tin theo đúng vị trí/nhãn của form tương ứng với schema.
- Điền giá trị chính xác vào từng trường, đúng loại dữ liệu/đơn vị mô tả của trường đó (xem quy tắc 8).
- Không tự tính toán/suy diễn giá trị còn thiếu (xem quy tắc 9).
- Ô trống => "" ; chữ mờ => dùng "[mờ]".
`;

const imageArrSchema = z
  .array(
    z.object({
      mimetype: z.string(),
      base64: z.string(),
    })
  )
  .min(1);
const pdfFileSchema = z.object({
  mimetype: z.literal("application/pdf"),
  base64: z.string(),
});
const normalizedArrSchema = z.union([imageArrSchema, pdfFileSchema]);
type NormalizedArr = z.infer<typeof normalizedArrSchema>;
type PdfFile = z.infer<typeof pdfFileSchema>;

export const buildOcrImageParts = (normalizedArr: z.infer<typeof imageArrSchema>) =>
  normalizedArr.map((file) => ({
    type: "image_url" as const,
    image_url: {
      url: extractImgUrl(file),
    },
  }));

export const buildOcrFilePart = (file: PdfFile) => ({
  type: "file" as const,
  source_type: "base64" as const,
  mime_type: file.mimetype,
  data: file.base64,
  metadata: { filename: "medical-record.pdf" },
});

export const ocrTool = tool(
  async (normalizedArr: NormalizedArr) => {
    const parts = Array.isArray(normalizedArr)
      ? buildOcrImageParts(normalizedArr)
      : [buildOcrFilePart(normalizedArr)];
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
